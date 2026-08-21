import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './_ai.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileBase64, mimeType } = req.body || {};
    if (!fileBase64) {
      return res.status(400).json({ error: 'Missing file data' });
    }

    const geminiKey = getGeminiApiKey();
    if (!geminiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is required for PDF/DOCX document parsing.' });
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = `Extract the structured resume information from this document into the following JSON format.
Return ONLY valid JSON matching this schema:
{
  "fullName": "Candidate Name",
  "title": "Professional Title",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "City, State",
  "website": "portfolio or linkedin url",
  "summary": "Professional summary...",
  "education": [
    {
      "id": "edu1",
      "school": "University Name",
      "degree": "B.S.",
      "field": "Computer Science",
      "startDate": "2018",
      "endDate": "2022",
      "description": ""
    }
  ],
  "experience": [
    {
      "id": "exp1",
      "company": "Company Name",
      "position": "Job Title",
      "location": "Location",
      "startDate": "Jan 2022",
      "endDate": "Present",
      "current": true,
      "description": "Key achievements and responsibilities in bullet form"
    }
  ],
  "skills": [
    { "id": "s1", "name": "Skill Name" }
  ],
  "projects": [
    {
      "id": "p1",
      "name": "Project Name",
      "link": "https://...",
      "tech": "Technologies used",
      "description": "What it does..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: fileBase64, mimeType: mimeType || 'application/pdf' } },
            { text: prompt },
          ],
        },
      ],
      config: {
        maxOutputTokens: 2500,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return res.status(500).json({ error: 'Failed to parse resume document' });
    }

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('parse-resume handler error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
