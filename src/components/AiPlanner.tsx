import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Sparkles, BookOpen, List, Activity, AlertCircle } from 'lucide-react';

export default function AiPlanner() {
  const {
    subjects,
    aiPlan,
    generateStudyPlan,
    isAiLoading
  } = useApp();

  const [availableHours, setAvailableHours] = useState(15);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjects.length === 0) {
      setErrorMessage('Please add some subjects in Subject Management first!');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setErrorMessage(null);
    try {
      await generateStudyPlan(availableHours);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate study plan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-xs border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Study Planner</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Design your personalized weekly study plan using Google Gemini
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Our intelligent pilot reads your active courses, class timetables, and comprehensive exam deadlines, formulating custom daily study blocks to lock in perfect grades.
          </p>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold animate-fade-in flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end sm:items-center gap-4 pt-2">
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Target Study Hours (per week): <span className="text-indigo-400 font-extrabold">{availableHours} Hrs</span>
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full sm:w-48 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAiLoading}
              className="w-full sm:w-auto py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/20"
            >
              {isAiLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  Generating Schedules...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Plan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Plans Output Render */}
      {isAiLoading ? (
        <div className="space-y-4 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs animate-pulse">
          <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto animate-spin border-2 border-t-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">StudyPilot AI is compiling details...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Gemini is processing exam weight metrics, and lecture timetables to construct optimal hourly calendars.</p>
        </div>
      ) : aiPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Weekly Tasks Plan */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Personalized Weekly Calendar</span>
            </h3>

            <div className="space-y-3">
              {aiPlan.weeklyPlan?.map((item, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-850">
                    {item.day}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.tasks?.map((tsk, tIdx) => (
                      <div key={tIdx} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-indigo-500 truncate max-w-[150px]">{tsk.subject}</span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded-full">{tsk.duration}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{tsk.topic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Daily schedule & Revision guides */}
          <div className="space-y-6">
            {/* Time allocation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Recommended Weekly Allocation</span>
              </h3>

              <div className="space-y-3 text-xs">
                {aiPlan.timeAllocation?.map((alloc, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{alloc.subject}</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{alloc.hours} Hours</span>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${Math.min((alloc.hours / availableHours) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily template schedule */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Daily Study Timeline</span>
              </h3>

              <div className="space-y-3 text-xs">
                {aiPlan.dailySchedule?.map((sched, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{sched.time}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">{sched.activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revision plan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <List className="w-4 h-4 text-indigo-500" />
                <span>General Revision Guidelines</span>
              </h3>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pl-4 list-disc font-sans leading-relaxed">
                {aiPlan.revisionPlan?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
          <Sparkles className="w-16 h-16 mb-3 text-indigo-500 opacity-20" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200">No Study Plan Active</h3>
          <p className="text-xs max-w-sm mx-auto mt-1 leading-relaxed">
            Specify your weekly study hours goal in the target slider above and click **Generate Plan** to analyze your course syllabus and log optimal calendars with Google Gemini.
          </p>
        </div>
      )}

    </div>
  );
}
