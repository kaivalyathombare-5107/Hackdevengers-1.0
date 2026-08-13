export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const data = req.body?.data;
    if (!data) return res.status(400).send('Invalid payload');

    const prompt = buildPrompt(data);
    const systemPrompt =
      'You are an expert resume reviewer. Give a score out of 10 at the start, then 3-5 concise bullet points: strengths, weaknesses, and actionable improvements. Be direct. Maximum 300 words.';

    // Try Groq first (fast, free tier)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const analysis = await callGroq(groqKey, systemPrompt, prompt);
        if (analysis) return res.status(200).json({ analysis, provider: 'groq' });
      } catch (err) {
        console.error('Groq failed, trying Gemini:', err);
      }
    }

    // Fallback to Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const analysis = await callGemini(geminiKey, systemPrompt, prompt);
        if (analysis) return res.status(200).json({ analysis, provider: 'gemini' });
      } catch (err) {
        console.error('Gemini failed:', err);
      }
    }

    return res.status(500).send('AI feedback unavailable. Both providers failed.');
  } catch (error: any) {
    console.error(error);
    return res.status(500).send('Internal server error: ' + (error?.message || 'unknown'));
  }
}

async function callGroq(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // 8 s hard timeout

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        // llama-3.1-8b-instant: Groq's fastest model — typical latency ~1-2 s
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
    });

    clearTimeout(timer);
    if (!response.ok) throw new Error(`Groq ${response.status}: ${await response.text()}`);
    const result = await response.json();
    return result?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000); // 12 s hard timeout

  try {
    const response = await fetch(
      // gemini-1.5-flash: no thinking mode, very fast (~2-3 s)
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.5,
          },
        }),
      }
    );

    clearTimeout(timer);
    if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function buildPrompt(data: any): string {
  const personal = `Name: ${data.fullName || 'N/A'}
Title: ${data.title || 'N/A'}
Email: ${data.email || 'N/A'}
Phone: ${data.phone || 'N/A'}
Location: ${data.location || 'N/A'}
Summary: ${data.summary || 'N/A'}`;

  const education = (data.education || [])
    .map((e: any) => `  - ${e.degree} in ${e.field} @ ${e.school} (${e.startDate || '?'}–${e.endDate || '?'})\n    ${e.description || ''}`)
    .join('\n') || '  None';

  const experience = (data.experience || [])
    .map((e: any) => `  - ${e.position} @ ${e.company} (${e.startDate || '?'}–${e.current ? 'Present' : e.endDate || '?'})\n    ${e.description || ''}`)
    .join('\n') || '  None';

  const skills = (data.skills || []).map((s: any) => s.name).join(', ') || 'None';

  const projects = (data.projects || [])
    .map((p: any) => `  - ${p.name} [${p.tech || 'N/A'}]: ${p.description || ''}`)
    .join('\n') || '  None';

  return `Review this resume. Score /10, then bullet-point feedback.\n\n${personal}\n\nEducation:\n${education}\n\nExperience:\n${experience}\n\nSkills: ${skills}\n\nProjects:\n${projects}`;
}
