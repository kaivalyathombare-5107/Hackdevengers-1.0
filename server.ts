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

function getGroqApiKey(): string {
  return (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '').trim();
}

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

/**
 * Universal AI caller with Groq as Primary and Gemini as Fallback
 */
async function callAiWithFallback({
  systemPrompt,
  userPrompt,
  jsonMode = false,
  maxTokens = 800,
  temperature = 0.5,
}: {
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const errors: string[] = [];

  // 1. PRIMARY: Groq (llama-3.3-70b-versatile)
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: maxTokens,
          temperature,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (res.ok) {
        const d = await res.json();
        const text = d?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        const errText = await res.text();
        console.warn('Groq primary attempt returned non-200:', res.status, errText);
        errors.push(`Groq (${res.status}): ${errText.slice(0, 150)}`);
      }
    } catch (err: any) {
      console.warn('Groq network error:', err?.message || err);
      errors.push(`Groq: ${err?.message || 'failed'}`);
    }
  } else {
    errors.push('Groq key not provided');
  }

  // 2. FALLBACK: Google Gemini
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const promptText = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: {
          maxOutputTokens: maxTokens,
          temperature,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });

      const text = response.text?.trim();
      if (text) return text;
    } catch (err: any) {
      console.warn('Gemini SDK attempt error:', err?.message || err);
      errors.push(`Gemini SDK: ${err?.message || 'failed'}`);
    }

    try {
      const promptText = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature,
              ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        }
      );
      if (res.ok) {
        const d = await res.json();
        const text = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (err: any) {
      errors.push(`Gemini REST: ${err?.message || 'failed'}`);
    }
  } else {
    errors.push('Gemini key not provided');
  }

  throw new Error(`AI generation failed (Groq Primary + Gemini Fallback). Details: ${errors.join(' | ')}`);
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
        return res.status(400).json({ error: 'Invalid payload: resume data missing' });
      }

      const prompt = buildPrompt(data);
      const systemPrompt =
        "You are an expert, highly critical resume reviewer. Be extremely strict. If the resume lacks fundamental information (like name, email, or has completely empty sections for education and experience), you MUST give it a very low score (e.g., 1/10 or 2/10) and bluntly state what is missing. Only give high scores (8+) if the resume is detailed, has impactful bullet points, and is fully populated. Do not hallucinate strengths if there is no data. Provide a score out of 10 at the beginning, followed by concise, actionable feedback with strengths and weaknesses.";

      const content = await callAiWithFallback({
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 600,
        temperature: 0.6,
      });

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

      let prompt = `Improve this resume bullet point to make it more professional, impactful, action-oriented, and quantified where appropriate. Keep it concise.\n`;
      if (context) {
        prompt += `Context of this role/section: ${context}\n`;
      }
      prompt += `Original Text: ${text}\nImproved Text (return just the single improved bullet point without extra explanation):`;

      const improved = await callAiWithFallback({
        userPrompt: prompt,
        maxTokens: 200,
        temperature: 0.6,
      });

      res.status(200).json({ improved: improved.replace(/^["']|["']$/g, '').trim() });
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

      const prompt = buildTailorPrompt(resumeData, jobDescription);
      const raw = await callAiWithFallback({
        userPrompt: prompt,
        jsonMode: true,
        maxTokens: 1000,
        temperature: 0.4,
      });

      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
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

      const raw = await callAiWithFallback({
        userPrompt: prompt,
        jsonMode: true,
        maxTokens: 1500,
        temperature: 0.5,
      });

      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
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

      const raw = await callAiWithFallback({
        userPrompt: prompt,
        jsonMode: true,
        maxTokens: 1000,
        temperature: 0.4,
      });

      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
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
