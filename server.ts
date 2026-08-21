import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// In-memory fallback stores when Supabase is not configured
const memoryShares = new Map<string, any>();
const memoryProgress = new Map<string, any[]>();
const memoryResumeVersions = new Map<string, any[]>();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable is required.');
  }
  return new GoogleGenAI({ apiKey });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Limit body size for resume document uploads (base64)
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // 1. AI Feedback on Resume
  app.post("/api/ai-feedback", async (req, res) => {
    try {
      const data = req.body?.data;
      if (!data) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const ai = getGeminiClient();
      const prompt = buildPrompt(data);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{
              text: "You are an expert, highly critical resume reviewer. Be extremely strict. If the resume lacks fundamental information (like name, email, or has completely empty sections for education and experience), you MUST give it a very low score (e.g., 1/10 or 2/10) and bluntly state what is missing. Only give high scores (8+) if the resume is detailed, has impactful bullet points, and is fully populated. Do not hallucinate strengths if there is no data. Provide a score out of 10 at the beginning, followed by concise, actionable feedback.\n\n" + prompt
            }]
          }
        ],
        config: {
          maxOutputTokens: 500,
          temperature: 0.7,
        }
      });

      const content = response.text;
      if (!content) {
        return res.status(500).json({ error: 'No response from Gemini.' });
      }

      res.status(200).json({ analysis: content });
    } catch (error: any) {
      console.error('ai-feedback error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 2. Improve Bullet Point
  app.post("/api/improve-line", async (req, res) => {
    try {
      const { text, context } = req.body || {};
      if (!text) {
        return res.status(400).json({ error: 'Missing text payload' });
      }

      const ai = getGeminiClient();
      let prompt = `Improve this resume bullet point to make it more professional, impactful, action-oriented, and quantified where appropriate. Keep it concise.\n`;
      if (context) {
        prompt += `Context of this role/section: ${context}\n`;
      }
      prompt += `Original Text: ${text}\nImproved Text (return just the single improved bullet point without extra explanation):`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      console.error('improve-line error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 3. Tailor Resume to Job Description
  app.post("/api/tailor-resume", async (req, res) => {
    try {
      const { resumeData, jobDescription } = req.body || {};
      if (!jobDescription?.trim()) {
        return res.status(400).json({ error: 'Missing job description' });
      }

      const ai = getGeminiClient();
      const prompt = buildTailorPrompt(resumeData, jobDescription);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 1000,
          temperature: 0.4,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) {
        return res.status(500).json({ error: 'AI response empty' });
      }

      const parsed = JSON.parse(text);
      res.status(200).json(parsed);
    } catch (error: any) {
      console.error('tailor-resume error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 4. Generate Interview Questions
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { resumeData, jobDescription } = req.body || {};
      const ai = getGeminiClient();

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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 1500,
          temperature: 0.5,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) {
        return res.status(500).json({ error: 'AI response empty' });
      }

      const parsed = JSON.parse(text);
      res.status(200).json(parsed);
    } catch (error: any) {
      console.error('generate-questions error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 5. Evaluate Interview Answer
  app.post("/api/evaluate-answer", async (req, res) => {
    try {
      const { question, answer, category } = req.body || {};
      if (!answer?.trim()) {
        return res.status(400).json({ error: 'Answer is required' });
      }

      const ai = getGeminiClient();
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 1000,
          temperature: 0.4,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) {
        return res.status(500).json({ error: 'AI response empty' });
      }

      const parsed = JSON.parse(text);
      res.status(200).json(parsed);
    } catch (error: any) {
      console.error('evaluate-answer error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 6. Parse Resume Document (PDF / DOCX base64)
  app.post("/api/parse-resume", async (req, res) => {
    try {
      const { fileBase64, mimeType } = req.body || {};
      if (!fileBase64) {
        return res.status(400).json({ error: 'Missing file data' });
      }

      const ai = getGeminiClient();
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
              { text: prompt }
            ]
          }
        ],
        config: {
          maxOutputTokens: 2500,
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) {
        return res.status(500).json({ error: 'Failed to parse resume document' });
      }

      const parsed = JSON.parse(text);
      res.status(200).json(parsed);
    } catch (error: any) {
      console.error('parse-resume error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 7. Share Resume
  app.post("/api/share-resume", async (req, res) => {
    try {
      const data = req.body?.data;
      if (!data) return res.status(400).json({ error: 'Missing data' });

      const supabase = getSupabase();
      if (supabase) {
        const { data: row, error } = await supabase
          .from('resume_shares')
          .insert({ data })
          .select('id')
          .single();
        if (!error && row) {
          return res.status(200).json({ id: row.id });
        }
      }

      // Memory fallback
      const shareId = 'share_' + Math.random().toString(36).slice(2, 11);
      memoryShares.set(shareId, data);
      res.status(200).json({ id: shareId });
    } catch (error: any) {
      console.error('share-resume error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Load Shared Resume
  app.get("/api/load-resume", async (req, res) => {
    try {
      const id = req.query?.id as string;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const supabase = getSupabase();
      if (supabase) {
        const { data: row, error } = await supabase
          .from('resume_shares')
          .select('data')
          .eq('id', id)
          .single();
        if (!error && row) {
          return res.status(200).json({ data: row.data });
        }
      }

      if (memoryShares.has(id)) {
        return res.status(200).json({ data: memoryShares.get(id) });
      }

      res.status(404).json({ error: 'Resume not found' });
    } catch (error: any) {
      console.error('load-resume error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Save & Get Progress
  app.post("/api/save-progress", (req, res) => {
    try {
      const { sessionId, ...entry } = req.body || {};
      const key = sessionId || 'default';
      const list = memoryProgress.get(key) || [];
      const newEntry = {
        id: 'prog_' + Date.now(),
        date: new Date().toISOString(),
        ...entry,
      };
      list.push(newEntry);
      memoryProgress.set(key, list.slice(-30));
      res.status(200).json({ success: true, entry: newEntry });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/get-progress", (req, res) => {
    const key = (req.query?.sessionId as string) || 'default';
    const list = memoryProgress.get(key) || [];
    res.status(200).json({ entries: list });
  });

  // 10. Saved Resume Versions
  app.get("/api/list-resume-versions", (req, res) => {
    const key = (req.query?.sessionId as string) || 'default';
    const versions = memoryResumeVersions.get(key) || [];
    res.status(200).json({ versions });
  });

  app.post("/api/save-resume-version", (req, res) => {
    try {
      const { sessionId, version } = req.body || {};
      const key = sessionId || 'default';
      const list = memoryResumeVersions.get(key) || [];
      const existingIdx = list.findIndex((v) => v.id === version.id);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...version, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({ ...version, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      memoryResumeVersions.set(key, list);
      res.status(200).json({ success: true, version });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/delete-resume-version", (req, res) => {
    try {
      const { sessionId, id } = req.body || req.query || {};
      const key = sessionId || 'default';
      let list = memoryResumeVersions.get(key) || [];
      list = list.filter((v) => v.id !== id);
      memoryResumeVersions.set(key, list);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ResumeForge server running on http://localhost:${PORT}`);
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

function buildTailorPrompt(data: any, jd: string) {
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

startServer();
