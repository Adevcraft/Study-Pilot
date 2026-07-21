import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, Sparkles, User, Cpu, BookOpen, Trash } from 'lucide-react';
import Markdown from './Markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PRESET_QUERIES = [
  "Explain Recursion step-by-step with simple examples.",
  "How do I find eigenvalues and eigenvectors in Linear Algebra?",
  "Write a quick guide on sorting lists in Python.",
  "What is the Feynman Technique and how does it help studying?"
];

export default function AiTutor() {
  const { askAiTutor } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your **StudyPilot AI Tutor** powered by Google Gemini. 🚀\n\nI can assist you with explaining complex theories, solving step-by-step mathematical proofs, reviewing code bugs, or quiz practice. What are we studying today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Exclude initial greeting from history to focus API resources
      const apiHistory = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const reply = await askAiTutor(textToSend, apiHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error connecting to my neural network. Please check your network or try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! What academic concept can I explain for you next?"
      }
    ]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col h-[78vh]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
              StudyPilot AI Tutor
            </h2>
            <p className="text-[10px] text-slate-400">Step-by-step problem solver & explanation partner</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Trash className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin" ref={scrollRef}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`p-2.5 rounded-xl h-fit flex-shrink-0 border ${
                isUser
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-800 dark:text-slate-200'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4 text-indigo-500" />}
              </div>

              <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                isUser
                  ? 'bg-indigo-500 text-white border-indigo-600'
                  : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/60'
              }`}>
                {isUser ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <Markdown content={m.content} />
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 text-indigo-500">
              <Cpu className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Preset study triggers */}
      {messages.length === 1 && (
        <div className="mb-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">Suggested Practice Queries:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="p-3 text-left border border-slate-150 dark:border-slate-850 hover:border-indigo-400 dark:hover:border-indigo-800 rounded-xl bg-slate-50/30 hover:bg-indigo-500/5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="flex gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-xl border border-slate-250 dark:border-slate-800"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a programming, math proof, explain recursion..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer flex-shrink-0 shadow-md shadow-indigo-600/15"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
