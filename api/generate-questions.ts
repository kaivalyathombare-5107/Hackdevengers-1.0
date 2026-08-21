import { generateWithAi } from './_ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { resumeData, jobDescription } = req.body || {};

    const prompt = `Based on the candidate's resume and target job description (if provided), generate realistic, role-tailored interview questions.
Resume Info:
- Title: ${resumeData?.title || 'Engineer'}
- Summary: ${resumeData?.summary || 'N/A'}
- Experience: ${(resumeData?.experience || []).map((e: any) => `${e.position} at ${e.company}: ${e.description}`).join('; ')}
- Skills: ${(resumeData?.skills || []).map((s: any) => s.name).join(', ')}
${jobDescription ? `\nTarget Job Description:\n${jobDescription.slice(0, 1500)}` : ''}

Generate 4-5 behavioral questions and 4-5 technical questions tailored to their background.
Return a JSON object matching this structure strictly:
{
  "behavioral": [
    {
      "id": "b_ai_1",
      "question": "Question text...",
      "difficulty": "medium",
      "tip": "Tip for answering using STAR method...",
      "domain": "Behavioral",
      "category": "behavioral"
    }
  ],
  "technical": [
    {
      "id": "t_ai_1",
      "question": "Technical question text...",
      "difficulty": "medium",
      "tip": "Tip on architectural or coding concepts...",
      "domain": "Technical",
      "category": "technical"
    }
  ]
}`;

    const raw = await generateWithAi({
      userPrompt: prompt,
      jsonMode: true,
      maxTokens: 1500,
      temperature: 0.5,
    });

    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('generate-questions handler error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
