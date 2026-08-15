export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, context } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Missing text payload' });
    }

    let prompt = 'Improve this resume bullet point to make it more professional, impactful, and action-oriented. Keep it concise. Return ONLY the improved text, nothing else.';
    if (context) {
      prompt += `\nContext of this role/section: ${context}`;
    }
    prompt += `\nOriginal Text: ${text}\nImproved Text:`;

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const improved = await callGroq(groqKey, prompt);
        if (improved) return res.status(200).json({ improved, provider: 'groq' });
      } catch (err) {
        console.error('Groq failed, falling back to Gemini:', err);
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const improved = await callGemini(geminiKey, prompt);
        if (improved) return res.status(200).json({ improved, provider: 'gemini' });
      } catch (err) {
        console.error('Gemini failed:', err);
      }
    }

    return res.status(500).json({ error: 'AI service is currently unavailable. Both providers failed.' });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error: ' + (error?.message || 'unknown') });
  }
}

async function callGroq(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`Groq error ${response.status}: ${await response.text()}`);
  const result = await response.json();
  return result?.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini error ${response.status}: ${await response.text()}`);
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}
