export default async function handler(req: any, res: any) {
  try {
    const method = req.method || (req?.request && req.request.method);
    if (method !== 'POST') {
      return res.status(405).send('Method not allowed');
    }

    let body = req.body;
    if (!body && typeof req.json === 'function') {
      body = await req.json();
    }

    if (!body && req.on) {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: any) => {
          data += chunk;
        });
        req.on('end', () => resolve(data ? JSON.parse(data) : {}));
        req.on('error', reject);
      });
    }

    const data = body?.data;
    if (!data) {
      return res.status(400).send('Invalid payload');
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!openaiKey && !geminiKey) {
      return res.status(500).send('AI API key is not configured. Set OPENAI_API_KEY or GEMINI_API_KEY in Vercel.');
    }

    const prompt = buildPrompt(data);
    let response;
    let content;

    if (openaiKey) {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume reviewer. Provide concise feedback on the resume, including strengths, improvement items, and formatting tips. Focus on the candidate details provided.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 450,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(`OpenAI request failed: ${errorText}`);
      }

      const result = await response.json();
      content = result?.choices?.[0]?.message?.content;
    } else {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-pro:generateText?key=${encodeURIComponent(geminiKey)}`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 450,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(`Gemini request failed: ${errorText}`);
      }

      const result = await response.json();
      content = result?.candidates?.[0]?.output;
    }

    if (!content) {
      return res.status(500).send('No AI response was returned.');
    }

    return res.status(200).json({ analysis: content });
  } catch (error) {
    return res.status(500).send('Internal server error');
  }
}

function buildPrompt(data: any) {
  const personal = `Name: ${data.fullName || 'N/A'}\nTitle: ${data.title || 'N/A'}\nEmail: ${data.email || 'N/A'}\nPhone: ${data.phone || 'N/A'}\nLocation: ${data.location || 'N/A'}\nWebsite: ${data.website || 'N/A'}\nSummary: ${data.summary || 'N/A'}`;
  const education = (data.education || [])
    .map((item: any) => `- ${item.degree || 'N/A'} in ${item.field || 'N/A'} at ${item.school || 'N/A'} (${item.startDate || 'N/A'} - ${item.endDate || 'N/A'})\n  ${item.description || ''}`)
    .join('\n');
  const experience = (data.experience || [])
    .map((item: any) => `- ${item.position || 'N/A'} at ${item.company || 'N/A'} in ${item.location || 'N/A'} (${item.startDate || 'N/A'} - ${item.current ? 'Present' : item.endDate || 'N/A'})\n  ${item.description || ''}`)
    .join('\n');
  const skills = (data.skills || []).map((item: any) => item.name || 'N/A').join(', ');
  const projects = (data.projects || [])
    .map((item: any) => `- ${item.name || 'N/A'} (${item.tech || 'N/A'})\n  ${item.description || ''}`)
    .join('\n');

  return `Review this resume data and provide a short summary of strengths, areas for improvement, and suggestions to improve the resume. Do not rewrite the resume.\n\nPersonal Info:\n${personal}\n\nEducation:\n${education || 'None'}\n\nExperience:\n${experience || 'None'}\n\nSkills:\n${skills || 'None'}\n\nProjects:\n${projects || 'None'}`;
}
