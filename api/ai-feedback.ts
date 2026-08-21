import { generateWithAi } from './_ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body?.data;
    if (!data) return res.status(400).json({ error: 'Invalid payload: resume data missing' });

    const prompt = buildPrompt(data);
    const systemPrompt =
      'You are an expert, highly critical resume reviewer. Be extremely strict. If the resume lacks fundamental information (like name, email, or has completely empty sections for education and experience), you MUST give it a very low score (e.g., 1/10 or 2/10) and bluntly state what is missing. Only give high scores (8+) if the resume is detailed, has impactful bullet points, and is fully populated. Do not hallucinate strengths if there is no data. Provide a score out of 10 at the beginning, followed by concise, actionable feedback with strengths and weaknesses.';

    const analysis = await generateWithAi({
      systemPrompt,
      userPrompt: prompt,
      maxTokens: 600,
      temperature: 0.6,
    });

    return res.status(200).json({ analysis });
  } catch (error: any) {
    console.error('ai-feedback handler error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

function buildPrompt(data: any): string {
  const personal = `Name: ${data.fullName || 'N/A'}
Title: ${data.title || 'N/A'}
Email: ${data.email || 'N/A'}
Phone: ${data.phone || 'N/A'}
Location: ${data.location || 'N/A'}
Website: ${data.website || 'N/A'}
Summary: ${data.summary || 'N/A'}`;

  const education = (data.education || [])
    .map((e: any) => `  - ${e.degree || ''} in ${e.field || ''} @ ${e.school || ''} (${e.startDate || '?'}–${e.endDate || '?'})\n    ${e.description || ''}`)
    .join('\n') || '  None';

  const experience = (data.experience || [])
    .map((e: any) => `  - ${e.position || ''} @ ${e.company || ''} (${e.startDate || '?'}–${e.current ? 'Present' : e.endDate || '?'})\n    ${e.description || ''}`)
    .join('\n') || '  None';

  const skills = (data.skills || []).map((s: any) => s.name).join(', ') || 'None';

  const projects = (data.projects || [])
    .map((p: any) => `  - ${p.name || ''} [${p.tech || 'N/A'}]: ${p.description || ''}`)
    .join('\n') || '  None';

  return `Review this resume data and provide a concise score out of 10, followed by actionable strengths, weaknesses, and concrete recommendations.\n\nPersonal Info:\n${personal}\n\nEducation:\n${education}\n\nExperience:\n${experience}\n\nSkills:\n${skills}\n\nProjects:\n${projects}`;
}
