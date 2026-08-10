export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const data = req.body?.data;
    if (!data) {
      return res.status(400).send('Invalid payload');
    }

    const prompt = buildPrompt(data);
    const systemPrompt =
      'You are an expert, highly critical resume reviewer. Be extremely strict. If the resume lacks fundamental information (like name, email, or has completely empty sections for education and experience), you MUST give it a very low score (e.g., 1/10 or 2/10) and bluntly state what is missing. Only give high scores (8+) if the resume is detailed, has impactful bullet points, and is fully populated. Do not hallucinate strengths if there is no data. Provide a score out of 10 at the beginning, followed by concise, actionable feedback.';

    // Try Groq first
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const analysis = await callGroq(groqKey, systemPrompt, prompt);
        if (analysis) {
          return res.status(200).json({ analysis, provider: 'groq' });
        }
      } catch (err) {
        console.error('Groq failed, falling back to Gemini:', err);
      }
    }

    // Fallback to Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const analysis = await callGemini(geminiKey, systemPrompt, prompt);
        if (analysis) {
          return res.status(200).json({ analysis, provider: 'gemini' });
        }
      } catch (err) {
        console.error('Gemini failed:', err);
      }
    }

    return res.status(500).send('AI feedback is currently unavailable. Both providers failed.');
  } catch (error: any) {
    console.error(error);
    return res.status(500).send('Internal server error: ' + (error?.message || 'unknown'));
  }
}

async function callGroq(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq error ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  return result?.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}

function buildPrompt(data: any) {
  const personal = `Name: ${data.fullName || 'N/A'}\nTitle: ${data.title || 'N/A'}\nEmail: ${data.email || 'N/A'}\nPhone: ${data.phone || 'N/A'}\nLocation: ${data.location || 'N/A'}\nWebsite: ${data.website || 'N/A'}\nSummary: ${data.summary || 'N/A'}`;
  const education = (data.education || [])
    .map((item: any) => `- ${item.degree} in ${item.field} at ${item.school} (${item.startDate || 'N/A'} - ${item.endDate || 'N/A'})\n  ${item.description || ''}`)
    .join('\n');
  const experience = (data.experience || [])
    .map((item: any) => `- ${item.position} at ${item.company} in ${item.location} (${item.startDate || 'N/A'} - ${item.current ? 'Present' : item.endDate || 'N/A'})\n  ${item.description || ''}`)
    .join('\n');
  const skills = (data.skills || []).map((item: any) => item.name).join(', ');
  const projects = (data.projects || [])
    .map((item: any) => `- ${item.name} (${item.tech || 'N/A'})\n  ${item.description || ''}`)
    .join('\n');

  return `Review this resume data and provide a short summary of strengths, areas for improvement, and suggestions to make the resume stronger. Do not rewrite the resume.\n\nPersonal Info:\n${personal}\n\nEducation:\n${education || 'None'}\n\nExperience:\n${experience || 'None'}\n\nSkills:\n${skills || 'None'}\n\nProjects:\n${projects || 'None'}`;
}
