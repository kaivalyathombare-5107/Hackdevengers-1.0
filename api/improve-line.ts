import { generateWithAi } from './_ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, context } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Missing text payload' });
    }

    let prompt = `Improve this resume bullet point to make it more professional, impactful, action-oriented, and quantified where appropriate. Keep it concise.\n`;
    if (context) {
      prompt += `Context of this role/section: ${context}\n`;
    }
    prompt += `Original Text: ${text}\nImproved Text (return just the single improved bullet point without extra explanation):`;

    const improved = await generateWithAi({
      userPrompt: prompt,
      maxTokens: 200,
      temperature: 0.6,
    });

    return res.status(200).json({ improved: improved.replace(/^["']|["']$/g, '').trim() });
  } catch (error: any) {
    console.error('improve-line handler error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
