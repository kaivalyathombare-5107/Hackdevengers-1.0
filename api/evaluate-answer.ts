import { generateWithAi } from './_ai.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question, answer, category } = req.body || {};
    if (!answer?.trim()) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const prompt = `You are a senior tech hiring manager and interview coach evaluating a candidate's response.
Question (${category || 'general'}): "${question}"
Candidate's Answer: "${answer}"

Evaluate the answer thoroughly. Scores should be integers from 1 to 10.
Return this exact JSON structure:
{
  "clarityScore": 8,
  "relevanceScore": 7,
  "structureScore": 8,
  "confidenceScore": 7,
  "overallScore": 8,
  "overallFeedback": "Concise 2-3 sentence overview of how well they answered.",
  "strengths": ["Clear STAR structure", "Quantified results"],
  "improvements": ["Elaborate on technical trade-offs", "Explain failure modes"],
  "improvedAnswer": "A polished, exemplar version of what a stellar response would look like."
}`;

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
    console.error('evaluate-answer handler error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
