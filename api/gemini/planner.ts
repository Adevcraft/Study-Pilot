import { Type } from '@google/genai';
import { getGeminiClient, cleanAndParseJson } from '../_lib/gemini';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subjects, availableHours, examDates } = req.body || {};

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required to generate a plan' });
    }

    let geminiObj;
    try {
      geminiObj = getGeminiClient();
    } catch (keyErr: any) {
      console.error('[AI Planner Key Error]:', keyErr);
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.'
      });
    }

    const { ai } = geminiObj;
    const hours = availableHours || 15;
    const subjStr = subjects.join(', ');
    const examsStr = JSON.stringify(examDates || {});

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
        return res.status(500).json({ error: `AI Planner returned invalid output format: ${parseErr.message}` });
      }

      return res.status(200).json(parsed);
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    console.error('[AI Planner Endpoint Exception]:', err);
    return res.status(500).json({
      error: `AI Planner failed: ${err.message || String(err)}`,
      details: err.stack || String(err)
    });
  }
}
