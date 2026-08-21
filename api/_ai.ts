import { GoogleGenAI } from '@google/genai';

export function getGroqApiKey(): string {
  const key = (
    process.env.GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    ''
  ).trim();
  return key;
}

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

/**
 * Generate AI responses with Groq as PRIMARY and Gemini as FALLBACK.
 */
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

  // ==========================================
  // 1. PRIMARY: Groq (llama-3.3-70b-versatile)
  // ==========================================
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
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
        console.warn('Groq primary attempt failed:', res.status, errText);
        errors.push(`Groq (${res.status}): ${errText.slice(0, 150)}`);
      }
    } catch (err: any) {
      console.warn('Groq connection error:', err?.message || err);
      errors.push(`Groq error: ${err?.message || 'network failed'}`);
    }
  } else {
    errors.push('Groq key not configured, falling back to Gemini');
  }

  // ==========================================
  // 2. FALLBACK: Google Gemini
  // ==========================================
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    // 2a. Try Gemini via @google/genai SDK
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

    // 2b. Try Gemini via direct REST fallback
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
        errors.push(`Gemini REST: ${res.status} ${errText.slice(0, 150)}`);
      }
    } catch (err: any) {
      errors.push(`Gemini REST error: ${err?.message || 'network failed'}`);
    }
  } else {
    errors.push('GEMINI_API_KEY not configured');
  }

  throw new Error(`All AI providers failed (Groq Primary + Gemini Fallback). Details: ${errors.join(' | ')}`);
}
