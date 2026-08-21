import { GoogleGenAI } from '@google/genai';

export function getGeminiApiKey(): string {
  const key = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
  return key;
}

export function getGroqApiKey(): string {
  const key = (
    process.env.GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    ''
  ).trim();
  return key;
}

export async function generateWithAi({
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

  // 1. Try Gemini via SDK
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents: any[] = [];
      const promptText = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
      contents.push({ role: 'user', parts: [{ text: promptText }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          maxOutputTokens: maxTokens,
          temperature,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });

      const text = response.text?.trim();
      if (text) return text;
    } catch (err: any) {
      console.error('Gemini SDK attempt error:', err?.message || err);
      errors.push(`Gemini SDK: ${err?.message || 'failed'}`);
    }

    // 1b. Try Gemini via direct REST fallback if SDK had issue
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
      } else {
        const errText = await res.text();
        errors.push(`Gemini REST: ${res.status} ${errText}`);
      }
    } catch (err: any) {
      errors.push(`Gemini REST error: ${err?.message || 'failed'}`);
    }
  } else {
    errors.push('GEMINI_API_KEY is not set');
  }

  // 2. Try Groq as secondary provider
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const messages: any[] = [];
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
        errors.push(`Groq: ${res.status} ${errText}`);
      }
    } catch (err: any) {
      errors.push(`Groq error: ${err?.message || 'failed'}`);
    }
  }

  throw new Error(`AI generation failed. Details: ${errors.join(' | ')}`);
}
