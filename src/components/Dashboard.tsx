import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, BookOpen, Calendar, CheckSquare, Clock, Flame, GraduationCap, ArrowRight, Play, Sparkles, TrendingUp } from 'lucide-react';
import Markdown from './Markdown';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const {
    currentUser,
    subjects,
    assignments,
    quizzes,
    exams,
    timetable,
    pdfs,
    aiAdvisorText,
    getAdvisorReport,
    isAiLoading
  } = useApp();

  // Fetch AI recommendations if not already generated on load
  useEffect(() => {
    if (subjects.length > 0 && !aiAdvisorText) {
      getAdvisorReport();
    }
  }, [subjects.length]);

  // Statistics & Progress calculations memoized with high accuracy and local timezone safety
  const {
    totalSubjects,
    pendingAssignments,
    upcomingQuizzes,
    upcomingExams,
    studyStreak,
    overallProgress
  } = React.useMemo(() => {
    const todayStr = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const totSub = subjects.length;
    const penAsg = assignments.filter(a => a.status === 'pending').length;
    
    // Check if quizzes are scheduled for today or in the future
    const upQuiz = quizzes.filter(q => {
      return q.date >= todayStr;
    }).length;

    // Fix bug: Check only for upcoming/today's exams instead of all exams
    const upExam = exams.filter(e => {
      return e.date >= todayStr;
    }).length;

    const streakVal = currentUser?.streak || 0;

    // Academic progress calculations
    const totalAssignments = assignments.length;
    const completedAssignmentsCount = assignments.filter(a => a.status === 'completed').length;
    const assignmentCompletionRate = totalAssignments > 0 ? (completedAssignmentsCount / totalAssignments) * 100 : 0;

    let marksTotal = 0;
    let marksObtained = 0;

    assignments.forEach(a => {
      if (a.status === 'completed' && a.obtainedMarks !== undefined) {
        marksTotal += a.totalMarks;
        marksObtained += a.obtainedMarks;
      }
    });

    quizzes.forEach(q => {
      if (q.obtainedMarks !== undefined) {
        marksTotal += q.totalMarks;
        marksObtained += q.obtainedMarks;
      }
    });

    const averageScorePct = marksTotal > 0 ? Math.round((marksObtained / marksTotal) * 100) : 0;
    const ovrProgress = Math.round(
      (assignmentCompletionRate * 0.4) + (averageScorePct * 0.6)
    ) || 0;

    return {
      totalSubjects: totSub,
      pendingAssignments: penAsg,
      upcomingQuizzes: upQuiz,
      upcomingExams: upExam,
      studyStreak: streakVal,
      overallProgress: ovrProgress
    };
  }, [subjects, assignments, quizzes, exams, currentUser?.streak]);

  // Format today's date
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  // Today's classes schedule
  const todayDayName = React.useMemo(() => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[new Date().getDay()] as any;
  }, []);

  const todaysClasses = React.useMemo(() => {
    return timetable
      .filter(t => t.day === todayDayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, todayDayName]);

  // Today's pending tasks - sorted by nearest due date first
  const pendingTasks = React.useMemo(() => {
    return [...assignments]
      .filter(a => a.status === 'pending')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
  }, [assignments]);

  // Recent activity feed compiled from uploads, completed work, and quiz scores
  const recentActivities = React.useMemo(() => {
    const list: Array<{ id: string; type: string; label: string; detail: string; time: string; timestamp: number }> = [];

    // PDF uploads
    pdfs.forEach(p => {
      const ts = p.uploadDate ? new Date(p.uploadDate).getTime() : 0;
      list.push({
        id: `pdf_${p.id}`,
        type: 'pdf',
        label: 'PDF Uploaded',
        detail: p.name,
        time: p.uploadDate ? new Date(p.uploadDate).toLocaleDateString() : 'Recently',
        timestamp: ts
      });
    });

    // Completed assignments
    assignments.forEach(a => {
      if (a.status === 'completed') {
        list.push({
          id: `asg_${a.id}`,
          type: 'assignment',
          label: 'Assignment Done',
          detail: a.title,
          time: 'Completed',
          timestamp: Date.now() - 3600000 // Treat as recent
        });
      }
    });

    // Quizzes taken
    quizzes.forEach(q => {
      if (q.obtainedMarks !== undefined) {
        list.push({
          id: `quiz_${q.id}`,
          type: 'quiz',
          label: 'Quiz Completed',
          detail: `${q.title} (${q.obtainedMarks}/${q.totalMarks})`,
          time: 'Completed',
          timestamp: Date.now() - 7200000 // Treat as recent
        });
      }
    });

    // Sort descending by timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);
  }, [pdfs, assignments, quizzes]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full filter blur-2xl -ml-16 -mb-16 pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium text-xs border border-indigo-100 dark:border-indigo-900/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{currentUser?.institution || 'Academic Hub'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome Back, <span className="text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 bg-clip-text">{currentUser?.name}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Today is <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedDate}</span>. Ready to ace your day?
          </p>
        </div>

        <button
          onClick={() => onNavigate('tutor')}
          className="relative z-10 flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-semibold rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-md shadow-indigo-600/20 group"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Ask AI Tutor</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:border-amber-200 dark:hover:border-amber-950/50 transition-colors">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Streak</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{studyStreak} Days</span>
          </div>
        </div>

        {/* Subjects */}
        <button onClick={() => onNavigate('subjects')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm text-left hover:border-indigo-200 dark:hover:border-indigo-950/50 transition-colors cursor-pointer">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Subjects</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{totalSubjects} Active</span>
          </div>
        </button>

        {/* Assignments */}
        <button onClick={() => onNavigate('assignments')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm text-left hover:border-emerald-200 dark:hover:border-emerald-950/50 transition-colors cursor-pointer">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pending</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{pendingAssignments} Tasks</span>
          </div>
        </button>

        {/* Quizzes */}
        <button onClick={() => onNavigate('quizzes')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm text-left hover:border-violet-200 dark:hover:border-violet-950/50 transition-colors cursor-pointer">
          <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Quizzes</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{upcomingQuizzes} Left</span>
          </div>
        </button>

        {/* Exams */}
        <button onClick={() => onNavigate('exams')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm text-left hover:border-rose-200 dark:hover:border-rose-950/50 transition-colors cursor-pointer">
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Exams</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{upcomingExams} Scheduled</span>
          </div>
        </button>

        {/* Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:border-cyan-200 dark:hover:border-cyan-950/50 transition-colors">
          <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 text-cyan-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Grade</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{overallProgress}% Avg</span>
          </div>
        </div>
      </div>

      {/* AI Advisory Panel */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Academic Advisor</h2>
              <p className="text-[11px] text-slate-400">Personalized grade optimization & real-time study strategy</p>
            </div>
          </div>
          <button
            onClick={getAdvisorReport}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            {isAiLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin mr-1" />
                Analyzing Metrics...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Refresh Advisor
              </>
            )}
          </button>
        </div>

        <div className="text-slate-300 relative z-10 prose prose-invert max-w-none text-sm leading-relaxed p-4 rounded-xl bg-slate-950/40 border border-slate-800/40">
          {isAiLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/4"></div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            </div>
          ) : aiAdvisorText ? (
            <Markdown content={aiAdvisorText} />
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 text-xs">No reports found. Add your subjects and assignments to trigger AI analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Today's Classes</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
              {todayDayName}
            </span>
          </div>

          <div className="space-y-3">
            {todaysClasses.length > 0 ? (
              todaysClasses.map(cl => {
                const sub = subjects.find(s => s.id === cl.subjectId);
                return (
                  <div key={cl.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">{sub?.code || 'CLASS'}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">{sub?.name || 'Lecture'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{cl.startTime}</span>
                      <span className="text-[10px] text-slate-400 block">to {cl.endTime}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span>Pending Deadlines</span>
            </h3>
            <button onClick={() => onNavigate('assignments')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {pendingTasks.length > 0 ? (
              pendingTasks.map(t => {
                const sub = subjects.find(s => s.id === t.subjectId);
                return (
                  <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase block" style={{ color: sub?.color || '#cbd5e1' }}>
                        {sub?.name || 'Subject'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{t.title}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Due Date</span>
                      <span className="text-xs font-semibold text-rose-500 block">{t.dueDate}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">All assignments completed! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links & Streaks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>AI Quick Pilot</span>
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('planner')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 dark:from-indigo-950/15 dark:to-cyan-950/15 border border-indigo-100/30 dark:border-indigo-900/10 text-left hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors cursor-pointer group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">AI Study Planner</span>
                <span className="text-[11px] text-slate-500 block">Generate smart revision plans and hours</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('tutor')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/5 to-indigo-500/5 dark:from-violet-950/15 dark:to-indigo-950/15 border border-violet-100/30 dark:border-violet-900/10 text-left hover:border-violet-300 dark:hover:border-violet-800 transition-colors cursor-pointer group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block">Instant AI Tutor</span>
                <span className="text-[11px] text-slate-500 block">Ask programming, math, and concept explanations</span>
              </div>
              <ArrowRight className="w-4 h-4 text-violet-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('pdfs')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 text-left hover:border-slate-300 dark:hover:border-slate-800 transition-all cursor-pointer group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Secure PDF Vault</span>
                <span className="text-[11px] text-slate-500 block">{pdfs.length} PDFs uploaded and backed up</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Recent Activity List */}
            {recentActivities.length > 0 && (
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Recent Activity</span>
                <div className="space-y-1.5">
                  {recentActivities.map(act => (
                    <div key={act.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/30">
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">{act.detail}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{act.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
