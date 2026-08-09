import type { NextRequest } from '@vercel/node';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body?.data;

    if (!data) {
      return new Response('Invalid payload', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('Gemini API key is not configured.', { status: 500 });
    }

    const prompt = buildPrompt(data);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume reviewer. Provide concise feedback on the candidate profile, strengths, and improvement suggestions.',
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
      return new Response(`Gemini request failed: ${errorText}`, { status: response.status });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response('No response from Gemini.', { status: 500 });
    }

    return new Response(JSON.stringify({ analysis: content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Internal server error', { status: 500 });
  }
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
