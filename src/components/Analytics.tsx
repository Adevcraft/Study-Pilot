import React from 'react';
import { useApp } from '../context/AppContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, BookOpen, Clock, Activity, CheckSquare } from 'lucide-react';

export default function Analytics() {
  const {
    subjects,
    assignments,
    quizzes
  } = useApp();

  // Memoize all analytics compilations to avoid recalculating heavy charts data on every single render
  const {
    totalAssignments,
    completedAssignmentsCount,
    assignmentCompletionRate,
    totalQuizzes,
    takenQuizzesCount,
    quizCompletionRate,
    averageScorePct,
    overallProgress,
    subjectPerformanceData,
    assignmentStatusData
  } = React.useMemo(() => {
    const totAsg = assignments.length;
    const compAsgCount = assignments.filter(a => a.status === 'completed').length;
    const asgCompRate = totAsg > 0 ? Math.round((compAsgCount / totAsg) * 100) : 0;

    const totQuiz = quizzes.length;
    const takenQuizCount = quizzes.filter(q => q.obtainedMarks !== undefined).length;
    const quizCompRate = totQuiz > 0 ? Math.round((takenQuizCount / totQuiz) * 100) : 0;

    // Calculate average score percentage
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

    const avgScorePct = marksTotal > 0 ? Math.round((marksObtained / marksTotal) * 100) : 0;
    const ovrProgress = Math.round(
      (asgCompRate * 0.4) + (avgScorePct * 0.6)
    ) || 0;

    // Subject performance bar chart data preparation
    const subPerfData = subjects.map(s => {
      let subTotal = 0;
      let subObtained = 0;

      // Compile assignments
      assignments.forEach(a => {
        if (a.subjectId === s.id && a.status === 'completed' && a.obtainedMarks !== undefined) {
          subTotal += a.totalMarks;
          subObtained += a.obtainedMarks;
        }
      });

      // Compile quizzes
      quizzes.forEach(q => {
        if (q.subjectId === s.id && q.obtainedMarks !== undefined) {
          subTotal += q.totalMarks;
          subObtained += q.obtainedMarks;
        }
      });

      const average = subTotal > 0 ? Math.round((subObtained / subTotal) * 100) : 0;
      const pending = assignments.filter(a => a.subjectId === s.id && a.status === 'pending').length;

      return {
        name: s.code,
        fullName: s.name,
        Score: average,
        PendingTasks: pending,
        color: s.color
      };
    });

    // Assignment state chart dataset
    const asgStatusData = [
      { name: 'Completed', value: compAsgCount, color: '#10B981' },
      { name: 'Pending', value: totAsg - compAsgCount, color: '#4F46E5' }
    ].filter(d => d.value > 0);

    return {
      totalAssignments: totAsg,
      completedAssignmentsCount: compAsgCount,
      assignmentCompletionRate: asgCompRate,
      totalQuizzes: totQuiz,
      takenQuizzesCount: takenQuizCount,
      quizCompletionRate: quizCompRate,
      averageScorePct: avgScorePct,
      overallProgress: ovrProgress,
      subjectPerformanceData: subPerfData,
      assignmentStatusData: asgStatusData
    };
  }, [subjects, assignments, quizzes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Academic Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track study metrics, assignment status, average grades, and course performance visualizers.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall grade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Progress</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{overallProgress}%</span>
            <span className="text-[10px] text-indigo-500 font-semibold">Grade Point Average base</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Quiz & Exam Score</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{averageScorePct}%</span>
            <span className="text-[10px] text-amber-500 font-semibold">Calculated from total weight</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Assignments Completion */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assignment Completion</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{assignmentCompletionRate}%</span>
            <span className="text-[10px] text-emerald-500 font-semibold">{completedAssignmentsCount} of {totalAssignments} done</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Quiz Completion */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quiz Completion</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{quizCompletionRate}%</span>
            <span className="text-[10px] text-violet-500 font-semibold">{takenQuizzesCount} of {totalQuizzes} completed</span>
          </div>
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visualizer charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar chart - Subject averages */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>Subject Performance Breakdown</span>
            </h3>
            <p className="text-[11px] text-slate-400">Comparing average scores percentage across courses</p>
          </div>

          <div className="h-64 sm:h-72 w-full text-xs">
            {subjectPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                    {subjectPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#4F46E5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <span>Add subjects to populate performance index.</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie chart - Assignment pending vs completed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span>Task Allocations</span>
            </h3>
            <p className="text-[11px] text-slate-400">Total assignments pending vs completed</p>
          </div>

          <div className="h-48 flex items-center justify-center">
            {assignmentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assignmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <span>No assignment log found.</span>
              </div>
            )}
          </div>

          {/* Pie chart Legends */}
          <div className="flex justify-center gap-6 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {assignmentStatusData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
