import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/ai-feedback", async (req, res) => {
    try {
      const data = req.body?.data;

      if (!data) {
        return res.status(400).send('Invalid payload');
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).send('Gemini API key is not configured.');
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = buildPrompt(data);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: "You are an expert, highly critical resume reviewer. Be extremely strict. If the resume lacks fundamental information (like name, email, or has completely empty sections for education and experience), you MUST give it a very low score (e.g., 1/10 or 2/10) and bluntly state what is missing. Only give high scores (8+) if the resume is detailed, has impactful bullet points, and is fully populated. Do not hallucinate strengths if there is no data. Provide a score out of 10 at the beginning, followed by concise, actionable feedback.\n\n" + prompt }] }
        ],
        config: {
          maxOutputTokens: 450,
          temperature: 0.7,
        }
      });

      const content = response.text;

      if (!content) {
        return res.status(500).send('No response from Gemini.');
      }

      res.status(200).json({ analysis: content });
    } catch (error: any) {
      console.error(error);
      let errMsg = 'Internal server error: ' + error.message;
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        errMsg = 'Invalid Gemini API Key. Please update your API key in the Settings.';
      }
      res.status(500).send(errMsg);
    }
  });

  app.post("/api/improve-line", async (req, res) => {
    try {
      const { text, context } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Missing text payload' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      let prompt = `Improve this resume bullet point to make it more professional, impactful, and action-oriented. Keep it concise.`;
      if (context) {
        prompt += `\nContext of this role/section: ${context}`;
      }
      prompt += `\nOriginal Text: ${text}\nImproved Text:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          maxOutputTokens: 200,
          temperature: 0.7,
        }
      });

      const improved = response.text?.trim();

      if (!improved) {
        return res.status(500).json({ error: 'No response from Gemini.' });
      }

      res.status(200).json({ improved });
    } catch (error: any) {
      console.error(error);
      let errMsg = 'Internal server error: ' + error.message;
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        errMsg = 'Invalid Gemini API Key. Please update your API key in the Settings.';
      }
      res.status(500).json({ error: errMsg });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
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

startServer();
