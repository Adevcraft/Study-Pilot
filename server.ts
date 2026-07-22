import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS & Request Logging Middleware for Vercel & AI Studio Preview
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  console.log(`[API Request Received]: ${req.method} ${req.url} (original: ${req.originalUrl || req.url})`);
  next();
});

// Helper function to extract Gemini API Key from various possible environment variables
function getGeminiApiKey(): string | null {
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

// Function to initialize Gemini client lazily per request
function getGeminiClient(): { ai: GoogleGenAI; apiKey: string } {
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

// Robust JSON Cleaner for schemas
function cleanAndParseJson(text: string): any {
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

// Health Check Endpoint
app.get(['/api/health', '/health', '/api/gemini/health'], (req, res) => {
  const apiKeyPresent = !!getGeminiApiKey();
  res.json({
    status: 'ok',
    apiKeyConfigured: apiKeyPresent,
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// AI Tutor Chat Endpoint
app.post(['/api/gemini/tutor', '/gemini/tutor', '/tutor', '/api/tutor'], async (req, res) => {
  try {
    const { question, history } = req.body || {};
    
    if (!question || typeof question !== 'string' || !question.trim()) {
      console.warn('[AI Tutor Request Invalid]: Missing question field');
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    let geminiObj: { ai: GoogleGenAI; apiKey: string };
    try {
      geminiObj = getGeminiClient();
    } catch (keyErr: any) {
      console.error('[AI Tutor Key Error]:', keyErr);
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.'
      });
      return;
    }

    const { ai } = geminiObj;

    const systemInstruction = 
      "You are StudyPilot AI, an elite, helpful, and highly adaptive academic tutor that behaves like ChatGPT.\n" +
      "Adhere strictly to these response rules:\n" +
      "- Answer according to the user's question only.\n" +
      "- Adapt response length dynamically based on the complexity of the question:\n" +
      "  * Short/Simple question -> Short, direct answer.\n" +
      "  * Medium question -> Medium length answer.\n" +
      "  * Complex/Detailed question or when explicitly asked for details -> Detailed explanation with structured headings, examples, and/or diagrams.\n" +
      "- Use bullet points whenever appropriate for readability.\n" +
      "- Do not write unnecessary introductions or conversational filler (get straight to the point).\n" +
      "- Keep all answers highly concise, direct, clean, and extremely easy to read.";

    const contents = [
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: question }] }
    ];

    console.log(`[AI Tutor]: Processing prompt "${question.slice(0, 60)}..."`);

    let timer: any = null;
    try {
      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Gemini API call timed out after 30 seconds')), 30000);
      });

      const response = await Promise.race([geminiCall, timeoutPromise]);

      if (!response.text) {
        console.warn('[AI Tutor]: Empty text returned by Gemini model');
        res.status(500).json({ error: 'AI Tutor received an empty response from the AI model.' });
        return;
      }

      console.log('[AI Tutor Success]: Successfully returned response');
      res.json({ text: response.text });
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    console.error('[AI Tutor Endpoint Exception]:', err);
    res.status(500).json({
      error: `AI Tutor failed: ${err.message || String(err)}`,
      details: err.stack || String(err)
    });
  }
});

// AI Study Planner Endpoint
app.post(['/api/gemini/planner', '/gemini/planner', '/planner', '/api/planner'], async (req, res) => {
  try {
    const { subjects, examDates, availableHours } = req.body || {};
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      console.warn('[AI Planner Request Invalid]: Subjects missing or empty array');
      res.status(400).json({ error: 'Subjects array is required' });
      return;
    }

    let geminiObj: { ai: GoogleGenAI; apiKey: string };
    try {
      geminiObj = getGeminiClient();
    } catch (keyErr: any) {
      console.error('[AI Planner Key Error]:', keyErr);
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.'
      });
      return;
    }

    const { ai } = geminiObj;
    const hours = availableHours || 15;
    const subjStr = subjects.join(', ');
    const examsStr = JSON.stringify(examDates || {});

    console.log(`[AI Planner]: Generating study plan for [${subjStr}], allocated hours: ${hours}`);

    const prompt = 
      `You are StudyPilot AI, an expert academic planner. Generate a highly personalized and optimized academic Study Plan for a student enrolled in: [${subjStr}].\n` +
      `Upcoming exam dates: ${examsStr}.\n` +
      `The student has allocated ${hours} hours per week for self-study.\n\n` +
      `Ensure you distribute study hours intelligently according to upcoming exam dates. Allocate more study blocks to courses with closer exams.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        weeklyPlan: {
          type: Type.ARRAY,
          description: "Custom weekly academic schedule organized by day focusing on deep studying, practice, and topic reviews.",
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    duration: { type: Type.STRING }
                  },
                  required: ["subject", "topic", "duration"]
                }
              }
            },
            required: ["day", "tasks"]
          }
        },
        dailySchedule: {
          type: Type.ARRAY,
          description: "An optimized daily learning routine recommending focus blocks, pomodoros, and breaks.",
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING },
              activity: { type: Type.STRING }
            },
            required: ["time", "activity"]
          }
        },
        revisionPlan: {
          type: Type.ARRAY,
          description: "Strategic checklist points or milestones for exam revision.",
          items: { type: Type.STRING }
        },
        timeAllocation: {
          type: Type.ARRAY,
          description: "Recommended hours allocation for each subject per week.",
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              hours: { type: Type.NUMBER }
            },
            required: ["subject", "hours"]
          }
        }
      },
      required: ["weeklyPlan", "dailySchedule", "revisionPlan", "timeAllocation"]
    };

    let timer: any = null;
    try {
      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Gemini API call timed out after 30 seconds')), 30000);
      });

      const response = await Promise.race([geminiCall, timeoutPromise]);
      const jsonText = response.text || '';

      let parsed;
      try {
        parsed = cleanAndParseJson(jsonText);
      } catch (parseErr: any) {
        console.error('[AI Planner JSON Error]: Failed to parse JSON response:', jsonText);
        res.status(500).json({ error: `AI Planner returned invalid output format: ${parseErr.message}` });
        return;
      }

      console.log('[AI Planner Success]: Successfully generated plan');
      res.json(parsed);
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    console.error('[AI Planner Endpoint Exception]:', err);
    res.status(500).json({
      error: `AI Planner failed: ${err.message || String(err)}`,
      details: err.stack || String(err)
    });
  }
});

// AI Academic Advisor Endpoint
app.post(['/api/gemini/advisor', '/gemini/advisor', '/advisor', '/api/advisor'], async (req, res) => {
  try {
    const { subjects, assignments, quizzes, schedule, exams } = req.body || {};

    let geminiObj: { ai: GoogleGenAI; apiKey: string };
    try {
      geminiObj = getGeminiClient();
    } catch (keyErr: any) {
      console.error('[AI Advisor Key Error]:', keyErr);
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.'
      });
      return;
    }

    const { ai } = geminiObj;

    console.log(`[AI Advisor]: Analyzing ${subjects?.length || 0} subjects, ${assignments?.length || 0} assignments, ${quizzes?.length || 0} quizzes`);

    const prompt = 
      `You are the elite StudyPilot AI Academic Advisor. Analyze the student's academic performance and schedule metrics:\n` +
      `Subjects: ${JSON.stringify(subjects || [])}\n` +
      `Assignments: ${JSON.stringify(assignments || [])}\n` +
      `Quizzes: ${JSON.stringify(quizzes || [])}\n` +
      `Class Timetables: ${JSON.stringify(schedule || [])}\n` +
      `Exams: ${JSON.stringify(exams || [])}\n\n` +
      `Generate a short, powerful, highly actionable dashboard advisory report (under 130 words).\n` +
      `Structure it perfectly using Markdown:\n` +
      `- State the exact strengths and weaknesses based on assignment completion and scores.\n` +
      `- Pinpoint the single subject needing immediate attention.\n` +
      `- Recommend concrete study hour-allocations and prioritized steps for today.\n` +
      `- Give an encouraging, high-energy motivational sign-off. Use bullet points and bold headers for maximum visual appeal.`;

    let timer: any = null;
    try {
      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Gemini API call timed out after 30 seconds')), 30000);
      });

      const response = await Promise.race([geminiCall, timeoutPromise]);
      const adviceText = response.text;

      if (!adviceText) {
        console.warn('[AI Advisor]: Empty response returned from model');
        res.status(500).json({ error: 'AI Advisor received an empty response from the AI model.' });
        return;
      }

      console.log('[AI Advisor Success]: Successfully generated advisory report');
      res.json({ advice: adviceText });
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    console.error('[AI Advisor Endpoint Exception]:', err);
    res.status(500).json({
      error: `AI Advisor failed: ${err.message || String(err)}`,
      details: err.stack || String(err)
    });
  }
});

// Serve static frontend files in production, use Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`StudyPilot AI server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  }
}

startServer();

export default app;
