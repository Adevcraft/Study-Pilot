import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Edit3, Plus, Trash2, X, AlertCircle } from 'lucide-react';

export default function Exams() {
  const {
    subjects,
    exams,
    addExam,
    editExam,
    deleteExam
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !date) return;

    if (editingId) {
      editExam(editingId, title, date);
      setEditingId(null);
    } else {
      addExam(subjectId, title, date);
    }

    // Reset Form
    setTitle('');
    setSubjectId('');
    setDate('');
    setIsAdding(false);
  };

  const handleEditTrigger = (ex: any) => {
    setEditingId(ex.id);
    setTitle(ex.title);
    setSubjectId(ex.subjectId);
    setDate(ex.date);
    setIsAdding(true);
  };

  const calculateDaysRemaining = (examDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(examDateStr);
    examDate.setHours(0, 0, 0, 0);

    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Exam Countdown</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Log upcoming finals, midterms, or standardized tests to prepare early with countdown reminders.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setTitle('');
            setSubjectId(subjects[0]?.id || '');
            setDate('');
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam Entry</span>
        </button>
      </div>

      {/* Grid of Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.length > 0 ? (
          exams.map(e => {
            const sub = subjects.find(s => s.id === e.subjectId);
            const daysRemaining = calculateDaysRemaining(e.date);

            let statusColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20";
            let statusText = `${daysRemaining} Days Left`;
            if (daysRemaining < 0) {
              statusColor = "bg-slate-100 text-slate-500 dark:bg-slate-800";
              statusText = "Completed";
            } else if (daysRemaining === 0) {
              statusColor = "bg-rose-50 text-rose-600 animate-pulse dark:bg-rose-950/20";
              statusText = "Today ⚠️";
            } else if (daysRemaining === 1) {
              statusColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/20";
              statusText = "Tomorrow 🚨";
            } else if (daysRemaining <= 3) {
              statusColor = "bg-rose-50 text-rose-600 dark:bg-rose-950/20";
            }

            return (
              <div key={e.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase" style={{ backgroundColor: sub?.color || '#cbd5e1' }}>
                      {sub?.code || 'CLASS'}
                    </span>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight mb-1 truncate">
                    {e.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Subject: {sub?.name || 'Academic Course'}</p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex items-center justify-between text-slate-500 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{e.date}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditTrigger(e)}
                      className="p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExamToDelete(e)}
                      className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500">
            <Calendar className="w-16 h-16 mx-auto mb-3 opacity-35 text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200">No Exam Countdowns</h3>
            <p className="text-xs max-w-[280px] mx-auto mt-1 leading-relaxed">
              Plan and log upcoming comprehensive final evaluations to receive countdown alerts and study schedule notifications automatically.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 relative">
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
              {editingId ? 'Edit Exam entry' : 'Log Academic Exam'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white disabled:opacity-60"
                  required
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Exam / Evaluation Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm 1 - Linear Systems"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Exam</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors mt-2"
              >
                {editingId ? 'Save Exam Details' : 'Save Countdown Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {examToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Calendar className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Exam Entry?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete the countdown entry for <span className="font-semibold text-slate-700 dark:text-slate-300">"{examToDelete.title}"</span>? This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExamToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteExam(examToDelete.id);
                  setExamToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
