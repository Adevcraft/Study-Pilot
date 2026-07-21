import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY is not set or is using the placeholder. Using simulated AI responses.');
      throw new Error('GEMINI_API_KEY_NOT_SET');
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
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

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Tutor Chat Endpoint
app.post('/api/gemini/tutor', async (req, res) => {
  try {
    const { question, history } = req.body;
    
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeySet = !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

    try {
      const gemini = getGeminiClient();
      
      // Build adaptive prompt with strict guidelines for dynamic ChatGPT-like responses
      const systemInstruction = 
        "You are StudyPilot AI, an elite, helpful, and highly adaptive academic tutor that behaves like ChatGPT.\n" +
        "Adhere strictly to these response rules:\n" +
        "- Answer according to the user's question only.\n" +
        "- Adapt response length dynamically based on the complexity of the question:\n" +
        "  * Short/Simple question -> Short, direct answer (e.g., 'Formula of water' -> 'Formula of Water: H₂O' with brief bullets).\n" +
        "  * Medium question -> Medium length answer.\n" +
        "  * Complex/Detailed question or when explicitly asked for details -> Detailed explanation with structured headings, examples, and/or diagrams.\n" +
        "- Use bullet points whenever appropriate for readability.\n" +
        "- Do not write unnecessary introductions or conversational filler (get straight to the point).\n" +
        "- Do not generate analogies unless the user explicitly asks for one.\n" +
        "- Do not generate Python code or code snippets unless the user explicitly requests code.\n" +
        "- Do not generate mathematical derivations unless explicitly requested.\n" +
        "- Do not generate Active Recall or practice questions unless the user explicitly asks for practice/quizzes.\n" +
        "- Use headings (###) only when absolutely needed for structure.\n" +
        "- Keep all answers highly concise, direct, clean, and extremely easy to read.";

      const contents = [
        ...(history || []).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: question }] }
      ];

      // Add a generous 30 seconds request timeout to allow deep generation on cold starts
      const geminiCall = gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      );

      const response = await Promise.race([geminiCall, timeoutPromise]);

      res.json({ text: response.text || "I couldn't generate an answer. Please try rephrasing." });
    } catch (apiErr: any) {
      console.warn('Gemini SDK error or timeout in tutor endpoint:', apiErr.message || apiErr);
      
      // Stop failing silently with placeholders when key is actually configured
      if (isKeySet) {
        res.status(500).json({ error: `AI Tutor failed: ${apiErr.message || apiErr}` });
        return;
      }

      // Highly-detailed fallbacks based on query analysis (only for non-configured users)
      const query = question.toLowerCase();
      let reply = "";
      
      if (query.includes('math') || query.includes('calculus') || query.includes('equation') || query.includes('integral') || query.includes('eigen') || query.includes('derivative') || query.includes('limit')) {
        reply = "### Understanding Calculus and Derivatives\n\nTo find the derivative of a function like $f(x) = 3x^2 + 5x + 2$, we apply the **Power Rule**:\n$$\\frac{d}{dx}[x^n] = n \\cdot x^{n-1}$$\n\nApplying this step-by-step:\n1. **For $3x^2$**: Bring down the exponent 2 to multiply by 3, giving $6x^{2-1} = 6x$.\n2. **For $5x$**: The derivative of $x$ is 1, so we get $5$.\n3. **For $2$**: The derivative of any constant is $0$.\n\n**Result:**\n$$f'(x) = 6x + 5$$\n\n### Interactive Practice Challenge\n*Try solving this yourself: Find the derivative of $g(x) = 4x^3 - 7x + 10$. Reply with your answer to check your work!*";
      } else if (query.includes('python') || query.includes('code') || query.includes('program') || query.includes('javascript') || query.includes('html') || query.includes('css') || query.includes('sort') || query.includes('recursion')) {
        reply = "### Quick Guide: Sorting an Array in Python\n\nIn Python, you can sort a list effortlessly using the built-in `.sort()` method or the `sorted()` function.\n\n```python\n# Using the sorted() function (returns a new sorted list)\nmarks = [85, 92, 78, 90, 88]\nsorted_marks = sorted(marks)\nprint(\"Original:\", marks)\nprint(\"Sorted:\", sorted_marks)\n\n# Sorting in reverse order (descending)\ndescending_marks = sorted(marks, reverse=True)\nprint(\"Descending:\", descending_marks)\n```\n\n**Key differences:**\n* `list.sort()` sorts the list **in-place** (modifies the original list).\n* `sorted(list)` returns a **new** sorted list, leaving the original list untouched.\n\n### Interactive Practice Challenge\n*Write a line of Python code that sorts a list of strings alphabetically in reverse. What function or parameter do you need? Let me know!*";
      } else if (query.includes('feynman') || query.includes('pomodoro') || query.includes('study') || query.includes('learn') || query.includes('recall') || query.includes('technique')) {
        reply = "### The Feynman Technique: Learn Like a Nobel Physicist\n\nThe **Feynman Technique** is a mental model for rapid learning and deep retention, designed by Nobel laureate Richard Feynman. It consists of 4 steps:\n\n1. **Choose a Concept**: Pick a topic you want to understand and write its name at the top of a blank page.\n2. **Explain it to a Toddler**: Write an explanation of the concept as if you were teaching it to a 10-year-old. Use simple words and clear analogies.\n3. **Identify Gaps**: When you get stuck, go back to your source material. Re-learn the details until you can express them simply.\n4. **Simplify & Analogize**: Organize your thoughts, polish the grammar, and create intuitive comparisons to tie everything together.\n\n*StudyPilot Tip: Combine this with 25-minute Pomodoro focus blocks to maximize focus and avoid mental fatigue!*";
      } else if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
        reply = "Hello there! I am your **StudyPilot AI Tutor**. 🚀\n\nHow can I help you excel in your academic journey today? I can explain complex theories, write clean code, solve step-by-step math proofs, or review study notes. What subject are we mastering today?";
      } else {
        reply = `### Conceptual Breakdown: Let's explore "${question}"\n\nTo master this concept, let's break it down into digestible elements:\n\n1. **Core Foundation**: Think of this as the baseline structural concept where each rule builds upon previous definitions.\n2. **Critical Variables**: Isolate the active elements in your query. Understanding how these factors interact is the quickest path to academic clarity.\n3. **Practical Strategy**: Utilize the **Active Recall** method. Close this screen, write down 3 key bullet points about what you just read, and verify your memory.\n\n*StudyPilot Tip: Research shows that reviewing study material within 24 hours of first exposure boosts long-term memory retention by over 80%!*`;
      }
      
      res.json({ text: reply + "\n\n*(Note: Running in high-fidelity simulated backup mode. Verify your GEMINI_API_KEY settings to activate live AI.)*" });
    }
  } catch (err: any) {
    console.error('Fatal tutor endpoint exception:', err);
    res.status(500).json({ error: 'Failed to process AI Tutor request' });
  }
});

// AI Study Planner Endpoint
app.post('/api/gemini/planner', async (req, res) => {
  try {
    const { subjects, examDates, availableHours } = req.body;
    
    if (!subjects || !subjects.length) {
      res.status(400).json({ error: 'Subjects are required' });
      return;
    }

    const hours = availableHours || 15;
    const subjStr = subjects.join(', ');
    const examsStr = JSON.stringify(examDates || {});

    // High quality dynamic fallback calculations
    const dynamicTimeAllocation = subjects.map((sub: string, index: number) => {
      const share = index === 0 ? 0.4 : index === 1 ? 0.3 : 0.3 / (subjects.length - 1 || 1);
      return { subject: sub, hours: Math.round(hours * share * 10) / 10 };
    });

    const dynamicWeeklyPlan = [
      {
        day: "Monday",
        tasks: [
          { subject: subjects[0], topic: "Deep study: Review foundational lecture slides, formulas, and definitions", duration: `${Math.round(hours * 0.15 * 10) / 10} hours` },
          { subject: subjects[1] || subjects[0], topic: "Active Recall: Work through textbook chapter problems and construct cards", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` }
        ]
      },
      {
        day: "Tuesday",
        tasks: [
          { subject: subjects[2] || subjects[0], topic: "Interactive practice: Complete homework sets and quiz preparations", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` },
          { subject: subjects[0], topic: "Feynman Technique: Explain complex structures to a peer or on a scratchpad", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` }
        ]
      },
      {
        day: "Wednesday",
        tasks: [
          { subject: subjects[1] || subjects[0], topic: "Conceptual deep dive: Draw mind maps, circuit diagrams, or code flowcharts", duration: `${Math.round(hours * 0.15 * 10) / 10} hours` },
          { subject: subjects[2] || subjects[0], topic: "Error review: Drill into harder definitions and practice assignments", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` }
        ]
      },
      {
        day: "Thursday",
        tasks: [
          { subject: subjects[0], topic: "Exam simulation: Time-bound mock quiz or previous test papers session", duration: `${Math.round(hours * 0.15 * 10) / 10} hours` },
          { subject: subjects[1] || subjects[0], topic: "Gaps audit: Focus on mistakes made during yesterday's mock session", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` }
        ]
      },
      {
        day: "Friday",
        tasks: [
          { subject: subjects[2] || subjects[0], topic: "Spaced Repetition: Quick speed review of weekly lecture guides", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` },
          { subject: subjects[0], topic: "Course consolidation: Sort workspace papers, organize PDF vaults, and plan next week", duration: `${Math.round(hours * 0.1 * 10) / 10} hours` }
        ]
      }
    ];

    const dynamicDailySchedule = [
      { time: "08:30 AM - 09:30 AM", activity: "High-retention morning review of key concepts (Active Recall)" },
      { time: "11:00 AM - 12:30 PM", activity: `Morning Focus Block: Deep analytical work for ${subjects[0]}` },
      { time: "02:00 PM - 03:30 PM", activity: "Afternoon Application Block: Coding, research writing, or problem solving" },
      { time: "05:00 PM - 06:00 PM", activity: "Light Spaced Repetition: Review mistakes log or flashcard deck" },
      { time: "09:30 PM - 10:00 PM", activity: "Reflection block: Record daily triumphs, review mistakes, plan tomorrow" }
    ];

    const dynamicRevisionPlan = [
      `Phase 1: Organize conceptual summaries and build active flashcard decks for ${subjects.join(', ')}.`,
      "Phase 2: Utilize spaced repetition to review newly acquired concepts within 24 hours.",
      "Phase 3: Tackle timing-locked mock exams to condition mind and pacing for test day.",
      "Phase 4: Run lightweight Mistake Journal reviews to polish edge-cases in your knowledge base."
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeySet = !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

    try {
      const gemini = getGeminiClient();
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

      const geminiCall = gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      );

      const response = await Promise.race([geminiCall, timeoutPromise]);

      const jsonText = response.text || '';
      const parsed = cleanAndParseJson(jsonText);
      res.json(parsed);
    } catch (apiErr: any) {
      console.warn('Gemini SDK error or timeout in planner endpoint:', apiErr.message || apiErr);
      
      if (isKeySet) {
        res.status(500).json({ error: `AI Planner failed: ${apiErr.message || apiErr}` });
        return;
      }
      
      const mockPlan = {
        weeklyPlan: dynamicWeeklyPlan,
        dailySchedule: dynamicDailySchedule,
        revisionPlan: dynamicRevisionPlan,
        timeAllocation: dynamicTimeAllocation
      };

      res.json(mockPlan);
    }
  } catch (err: any) {
    console.error('Fatal planner endpoint exception:', err);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// AI Academic Advisor Endpoint
app.post('/api/gemini/advisor', async (req, res) => {
  try {
    const { subjects, assignments, quizzes, schedule, exams } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeySet = !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

    // Prepare simulated report backups for when key is missing
    const pendingAssignments = assignments?.filter((a: any) => a.status === 'pending') || [];
    const subjectGrades: { [key: string]: { total: number, obtained: number, count: number } } = {};
    
    assignments?.forEach((a: any) => {
      if (a.obtainedMarks !== undefined) {
        if (!subjectGrades[a.subjectId]) subjectGrades[a.subjectId] = { total: 0, obtained: 0, count: 0 };
        subjectGrades[a.subjectId].total += Number(a.totalMarks || 100);
        subjectGrades[a.subjectId].obtained += Number(a.obtainedMarks || 0);
        subjectGrades[a.subjectId].count += 1;
      }
    });

    quizzes?.forEach((q: any) => {
      if (q.obtainedMarks !== undefined) {
        if (!subjectGrades[q.subjectId]) subjectGrades[q.subjectId] = { total: 0, obtained: 0, count: 0 };
        subjectGrades[q.subjectId].total += Number(q.totalMarks || 100);
        subjectGrades[q.subjectId].obtained += Number(q.obtainedMarks || 0);
        subjectGrades[q.subjectId].count += 1;
      }
    });

    let weakestSubjectName = "";
    let weakestPercent = 100;
    
    Object.keys(subjectGrades).forEach(subId => {
      const sub = subjectGrades[subId];
      const pct = (sub.obtained / sub.total) * 100;
      if (pct < weakestPercent) {
        weakestPercent = pct;
        const matchingSub = subjects?.find((s: any) => s.id === subId);
        if (matchingSub) weakestSubjectName = matchingSub.name;
      }
    });

    if (!weakestSubjectName && subjects && subjects.length > 0) {
      weakestSubjectName = subjects[0].name;
      weakestPercent = 85;
    }

    let adviceText = "";
    if (subjects && subjects.length > 0) {
      const priorityTaskText = pendingAssignments.length > 0 
        ? `Complete your priority pending assignment (**${pendingAssignments[0].title}**)`
        : "Work through your standard Active Recall textbook exercises";

      adviceText = 
        `### StudyPilot AI Advisory Report 🚀\n\n` +
        `* **Primary Analysis**: Your assignments and quizzes show excellent baseline commitment. Currently, **${weakestSubjectName}** sits at **${Math.round(weakestPercent)}%** overall, indicating it is your primary growth opportunity.\n\n` +
        `* **Action Plan for Today**:\n` +
        `  1. Allocate **90 minutes** to targeted study of challenging topics in **${weakestSubjectName}**.\n` +
        `  2. ${priorityTaskText} to avoid deadline bottle-necks.\n\n` +
        `* **Strengths**: Solid consistency with assignment submissions. Maintain this momentum!\n\n` +
        `*“The secret of getting ahead is getting started. You've got this!”* \n\n*(Note: Running in high-fidelity backup mode. Set GEMINI_API_KEY in Settings > Secrets for live diagnostics.)*`;
    } else {
      adviceText = 
        `### Welcome to StudyPilot AI! 🎓\n\n` +
        `To unlock personalized academic advice and custom study recommendations, get started with the following steps:\n` +
        `1. Add your active courses in **Subject Management**.\n` +
        `2. Log some **Assignments**, **Quizzes**, or **Exams**.\n\n` +
        `Once populated, my neural advisor will immediately analyze your weekly metrics, pinpoint challenges, and outline optimal daily study goals!`;
    }

    try {
      const gemini = getGeminiClient();
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

      const geminiCall = gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      );

      const response = await Promise.race([geminiCall, timeoutPromise]);

      res.json({ advice: response.text || "Your academic data is synchronized! Keep log records updated to unlock deep insights." });
    } catch (apiErr: any) {
      console.warn('Gemini SDK error or timeout in advisor endpoint:', apiErr.message || apiErr);
      
      if (isKeySet) {
        res.status(500).json({ error: `AI Advisor failed: ${apiErr.message || apiErr}` });
        return;
      }

      res.json({ advice: adviceText });
    }
  } catch (err: any) {
    console.error('Fatal advisor endpoint exception:', err);
    res.status(500).json({ error: 'Failed to generate advisory insights' });
  }
});


// Serve static frontend files in production, use Vite middleware in dev
async function startServer() {
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
    console.log(`StudyPilot AI server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
