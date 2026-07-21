import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Edit3, Plus, Trash2, X, AlertCircle, Percent } from 'lucide-react';
import { Assignment } from '../types';

export default function Assignments() {
  const {
    subjects,
    assignments,
    addAssignment,
    editAssignment,
    deleteAssignment
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [obtainedMarks, setObtainedMarks] = useState<string>('');

  // Filtering / Sorting
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !dueDate) return;

    const parsedObtained = obtainedMarks !== '' ? Number(obtainedMarks) : undefined;

    if (editingId) {
      editAssignment(editingId, {
        title,
        subjectId,
        dueDate,
        priority,
        status,
        totalMarks: Number(totalMarks),
        obtainedMarks: parsedObtained
      });
      setEditingId(null);
    } else {
      addAssignment({
        title,
        subjectId,
        dueDate,
        priority,
        status,
        totalMarks: Number(totalMarks),
        obtainedMarks: parsedObtained
      });
    }

    // Reset Form
    setTitle('');
    setSubjectId('');
    setDueDate('');
    setPriority('medium');
    setStatus('pending');
    setTotalMarks(100);
    setObtainedMarks('');
    setIsAdding(false);
  };

  const handleEditTrigger = (asg: Assignment) => {
    setEditingId(asg.id);
    setTitle(asg.title);
    setSubjectId(asg.subjectId);
    setDueDate(asg.dueDate);
    setPriority(asg.priority);
    setStatus(asg.status);
    setTotalMarks(asg.totalMarks);
    setObtainedMarks(asg.obtainedMarks !== undefined ? asg.obtainedMarks.toString() : '');
    setIsAdding(true);
  };

  // Filter & Sort logic
  const filteredAssignments = assignments
    .filter(a => {
      if (filterStatus === 'all') return true;
      return a.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return a.dueDate.localeCompare(b.dueDate);
      } else {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Assignment Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track deadlines, grade weights, and completion statistics across semesters.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setTitle('');
            setSubjectId(subjects[0]?.id || '');
            setDueDate('');
            setPriority('medium');
            setStatus('pending');
            setTotalMarks(100);
            setObtainedMarks('');
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Assignment</span>
        </button>
      </div>

      {/* Main Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        <div className="flex gap-2">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filterStatus === f
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-150 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assignment Name</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Obtained / Total Marks</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(a => {
                  const sub = subjects.find(s => s.id === a.subjectId);
                  const percentage = a.obtainedMarks !== undefined ? Math.round((a.obtainedMarks / a.totalMarks) * 100) : null;

                  return (
                    <tr key={a.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-md text-[10px] text-white" style={{ backgroundColor: sub?.color || '#cbd5e1' }}>
                          {sub?.code || 'CLASS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{a.title}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{a.dueDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.priority === 'high' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/25' :
                          a.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/25' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-850'
                        }`}>
                          {a.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {a.obtainedMarks !== undefined ? (
                          <span className="text-slate-900 dark:text-white font-extrabold">{a.obtainedMarks} <span className="text-slate-400 font-normal">/ {a.totalMarks}</span></span>
                        ) : (
                          <span className="text-slate-400 font-normal">-- / {a.totalMarks}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {percentage !== null ? (
                          <span className="inline-flex items-center gap-1 font-black text-indigo-600 dark:text-indigo-400">
                            {percentage}%
                            <Percent className="w-3 h-3 text-indigo-400" />
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            const newStatus = a.status === 'completed' ? 'pending' : 'completed';
                            editAssignment(a.id, { status: newStatus });
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            a.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/20'
                          }`}
                        >
                          {a.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditTrigger(a)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAssignmentToDelete(a)}
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
            <CheckSquare className="w-16 h-16 mx-auto mb-3 opacity-30 text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200">No Assignments Found</h3>
            <p className="text-xs max-w-[280px] mx-auto mt-1 leading-relaxed">
              Create an assignment to start monitoring deadlines and calculating performance metrics automatically!
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
              {editingId ? 'Edit Assignment details' : 'Log Academic Assignment'}
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Laboratory Report 2"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
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
                    placeholder="e.g. 92"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors mt-2"
              >
                {editingId ? 'Save Assignment Changes' : 'Log New Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {assignmentToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Assignment?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{assignmentToDelete.title}"</span>? This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssignmentToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAssignment(assignmentToDelete.id);
                  setAssignmentToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Assignment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
