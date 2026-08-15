export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { resumeData, jobDescription } = req.body || {};
  if (!jobDescription?.trim()) return res.status(400).json({ error: 'Missing job description' });

  const prompt = buildPrompt(resumeData, jobDescription);

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const result = await callGroq(groqKey, prompt);
      if (result) return res.status(200).json(result);
    } catch (err) { console.error('Groq failed:', err); }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const result = await callGemini(geminiKey, prompt);
      if (result) return res.status(200).json(result);
    } catch (err) { console.error('Gemini failed:', err); }
  }

  return res.status(500).json({ error: 'AI unavailable' });
}

function buildPrompt(data: any, jd: string) {
  const skills = (data?.skills || []).map((s: any) => s.name).join(', ');
  const expSummary = (data?.experience || [])
    .map((e: any) => `${e.position} at ${e.company}: ${e.description || ''}`)
    .slice(0, 3).join('\n');

  return `You are an expert resume consultant. Analyze this resume against the job description and return a JSON object ONLY — no markdown, no extra text.

JOB DESCRIPTION:
${jd.slice(0, 1500)}

RESUME SUMMARY:
Name: ${data?.fullName || 'N/A'}
Title: ${data?.title || 'N/A'}
Current Summary: ${data?.summary || 'N/A'}
Skills: ${skills || 'N/A'}
Experience:
${expSummary || 'N/A'}

Return this exact JSON structure:
{
  "matchScore": <integer 0-100>,
  "tailoredSummary": "<2-3 sentence professional summary targeting this specific role>",
  "recommendedSkills": ["<skill1>", "<skill2>", "...up to 8 skills from the JD not in the resume>"],
  "missingKeywords": ["<keyword1>", "<keyword2>", "...up to 6 important keywords from the JD missing from the resume>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"]
}`;
}

async function callGroq(apiKey: string, prompt: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600, temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`Groq ${r.status}`);
    const d = await r.json();
    const text = d?.choices?.[0]?.message?.content?.trim();
    return text ? JSON.parse(text) : null;
  } catch (e) { clearTimeout(t); throw e; }
}

async function callGemini(apiKey: string, prompt: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 14000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
        }),
      }
    );
    clearTimeout(t);
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const d = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) { clearTimeout(t); throw e; }
}
