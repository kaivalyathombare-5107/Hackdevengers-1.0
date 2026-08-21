import { generateWithAi } from './_ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { resumeData, jobDescription } = req.body || {};
    if (!jobDescription?.trim()) return res.status(400).json({ error: 'Missing job description' });

    const prompt = buildPrompt(resumeData, jobDescription);
    const raw = await generateWithAi({
      userPrompt: prompt,
      jsonMode: true,
      maxTokens: 1000,
      temperature: 0.4,
    });

    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('tailor-resume handler error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

function buildPrompt(data: any, jd: string) {
  const skills = (data?.skills || []).map((s: any) => s.name).join(', ');
  const expSummary = (data?.experience || [])
    .map((e: any) => `${e.position} at ${e.company}: ${e.description || ''}`)
    .slice(0, 4).join('\n');

  return `You are an expert resume consultant. Analyze this resume against the job description and return a JSON object ONLY.

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
  "matchScore": 85,
  "tailoredSummary": "2-3 sentence professional summary targeting this specific role",
  "recommendedSkills": ["skill1", "skill2", "up to 8 skills from JD"],
  "missingKeywords": ["keyword1", "keyword2", "up to 6 missing keywords"],
  "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}`;
}
