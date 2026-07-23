import { GoogleGenAI } from '@google/genai';

export function getGeminiApiKey(): string | null {
  const possibleKeys = [
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GEMINI_KEY
  ];

  for (const rawKey of possibleKeys) {
    if (!rawKey) continue;
    const trimmed = rawKey.trim().replace(/^["']|["']$/g, '');
    if (
      trimmed &&
      trimmed !== 'MY_GEMINI_API_KEY' &&
      trimmed !== 'undefined' &&
      trimmed !== 'null'
    ) {
      return trimmed;
    }
  }
  return null;
}

export function getGeminiClient(): { ai: GoogleGenAI; apiKey: string } {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error('[Gemini API Setup Error]: No valid Gemini API key found in environment variables. Checked GEMINI_API_KEY, VITE_GEMINI_API_KEY, GOOGLE_GENAI_API_KEY, GOOGLE_API_KEY, GEMINI_KEY.');
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  return { ai, apiKey };
}

export function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}
