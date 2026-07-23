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
    const { question, history } = req.body || {};
    
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let geminiObj;
    try {
      geminiObj = getGeminiClient();
    } catch (keyErr: any) {
      console.error('[AI Tutor Key Error]:', keyErr);
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.'
      });
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
      "- Present code snippets with full syntax formatting.\n" +
      "- Break complex multi-step math or science problems into clear numbered steps.\n" +
      "- Maintain an encouraging, academic tone.";

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (!msg.content) continue;
        const role = msg.role === 'user' ? 'user' : 'model';
        contents.push({
          role,
          parts: [{ text: String(msg.content) }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: question.trim() }]
    });

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
      const reply = response.text;

      if (!reply) {
        return res.status(500).json({ error: 'AI Tutor returned an empty response.' });
      }

      return res.status(200).json({ reply });
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    console.error('[AI Tutor Endpoint Exception]:', err);
    return res.status(500).json({
      error: `AI Tutor failed: ${err.message || String(err)}`,
      details: err.stack || String(err)
    });
  }
}
