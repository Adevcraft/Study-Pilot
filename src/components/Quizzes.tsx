import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Edit3, Plus, Trash2, X, Percent } from 'lucide-react';
import { Quiz } from '../types';

export default function Quizzes() {
  const {
    subjects,
    quizzes,
    addQuiz,
    editQuiz,
    deleteQuiz
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [totalMarks, setTotalMarks] = useState<number>(10);
  const [obtainedMarks, setObtainedMarks] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !date) return;

    const parsedObtained = obtainedMarks !== '' ? Number(obtainedMarks) : undefined;

    if (editingId) {
      editQuiz(editingId, {
        title,
        subjectId,
        date,
        totalMarks: Number(totalMarks),
        obtainedMarks: parsedObtained
      });
      setEditingId(null);
    } else {
      addQuiz({
        title,
        subjectId,
        date,
        totalMarks: Number(totalMarks),
        obtainedMarks: parsedObtained
      });
    }

    // Reset Form
    setTitle('');
    setSubjectId('');
    setDate('');
    setTotalMarks(10);
    setObtainedMarks('');
    setIsAdding(false);
  };

  const handleEditTrigger = (q: Quiz) => {
    setEditingId(q.id);
    setTitle(q.title);
    setSubjectId(q.subjectId);
    setDate(q.date);
    setTotalMarks(q.totalMarks);
    setObtainedMarks(q.obtainedMarks !== undefined ? q.obtainedMarks.toString() : '');
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quiz Manager</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Log class pop quizzes, calculate final scores, and watch your margins improve.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setTitle('');
            setSubjectId(subjects[0]?.id || '');
            setDate('');
            setTotalMarks(10);
            setObtainedMarks('');
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Quiz Record</span>
        </button>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {quizzes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Quiz Title</th>
                  <th className="py-3 px-4">Quiz Date</th>
                  <th className="py-3 px-4">Obtained / Total Marks</th>
                  <th className="py-3 px-4">Quiz Percentage</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(q => {
                  const sub = subjects.find(s => s.id === q.subjectId);
                  const percentage = q.obtainedMarks !== undefined ? Math.round((q.obtainedMarks / q.totalMarks) * 100) : null;

                  return (
                    <tr key={q.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-md text-[10px] text-white" style={{ backgroundColor: sub?.color || '#cbd5e1' }}>
                          {sub?.code || 'CLASS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{q.title}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{q.date}</td>
                      <td className="py-3.5 px-4">
                        {q.obtainedMarks !== undefined ? (
                          <span className="text-slate-900 dark:text-white font-extrabold">{q.obtainedMarks} <span className="text-slate-400 font-normal">/ {q.totalMarks}</span></span>
                        ) : (
                          <span className="text-slate-400 italic">Score pending...</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {percentage !== null ? (
                          <span className="inline-flex items-center gap-1 font-black text-indigo-600 dark:text-indigo-400">
                            {percentage}%
                            <Percent className="w-3.5 h-3.5 text-indigo-400" />
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditTrigger(q)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQuizToDelete(q)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Clock className="w-16 h-16 mx-auto mb-3 opacity-30 text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200">No Quiz Records Logged</h3>
            <p className="text-xs max-w-[280px] mx-auto mt-1 leading-relaxed">
              Add small tests or mock evaluations to monitor sub-chapter completions easily!
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
              {editingId ? 'Edit Quiz details' : 'Log Quiz Performance'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pop Quiz 1 - Induction Proofs"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quiz Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Obtained Marks (Optional)</label>
                  <input
                    type="number"
                    value={obtainedMarks}
                    onChange={(e) => setObtainedMarks(e.target.value)}
                    placeholder="e.g. 8.5"
                    step="0.1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors mt-2"
              >
                {editingId ? 'Save Quiz Changes' : 'Log Quiz Performance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Clock className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Quiz Record?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{quizToDelete.title}"</span>? This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setQuizToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteQuiz(quizToDelete.id);
                  setQuizToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Quiz
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
