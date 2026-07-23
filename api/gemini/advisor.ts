import { getGeminiClient } from '../_lib/gemini';

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
    const { subjects, assignments, quizzes, schedule, exams } = req.body || {};

    let geminiObj;
    try {
      geminiObj = getGeminiClient();
    } catch (keyErr: any) {
      console.error('[AI Advisor Key Error]:', keyErr);
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.'
      });
    }

    const { ai } = geminiObj;

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
        return res.status(500).json({ error: 'AI Advisor received an empty response from the AI model.' });
      }

      return res.status(200).json({ advice: adviceText });
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    console.error('[AI Advisor Endpoint Exception]:', err);
    return res.status(500).json({
      error: `AI Advisor failed: ${err.message || String(err)}`,
      details: err.stack || String(err)
    });
  }
}
