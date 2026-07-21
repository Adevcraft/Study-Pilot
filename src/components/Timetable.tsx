import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Plus, Trash2, X, Calendar } from 'lucide-react';
import { TimetableEntry } from '../types';

const DAYS_OF_WEEK: TimetableEntry['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function Timetable() {
  const {
    subjects,
    timetable,
    addTimetableEntry,
    deleteTimetableEntry
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState<TimetableEntry['day']>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !day || !startTime || !endTime) return;

    addTimetableEntry(subjectId, day, startTime, endTime);

    // Reset Form
    setSubjectId('');
    setStartTime('09:00');
    setEndTime('10:30');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize your weekly class sessions, lectures, labs, and workspace blocks.</p>
        </div>
        <button
          onClick={() => {
            setSubjectId(subjects[0]?.id || '');
            setDay('Monday');
            setStartTime('09:00');
            setEndTime('10:30');
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule Block</span>
        </button>
      </div>

      {/* Grid: 7 days columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map(currentDay => {
          const dayEntries = timetable
            .filter(t => t.day === currentDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === currentDay;

          return (
            <div
              key={currentDay}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-3 flex flex-col justify-between min-h-[300px] shadow-xs ${
                isToday
                  ? 'border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                    {currentDay}
                  </span>
                  {isToday && (
                    <span className="text-[9px] uppercase font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {dayEntries.length > 0 ? (
                    dayEntries.map(entry => {
                      const sub = subjects.find(s => s.id === entry.subjectId);
                      return (
                        <div
                          key={entry.id}
                          className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-left relative group hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: sub?.color || '#64748b' }}>
                              {sub?.code || 'CLASS'}
                            </span>
                            <button
                              onClick={() => {
                                setEntryToDelete({ id: entry.id, name: sub?.name || 'Class Block', day: entry.day, time: `${entry.startTime} - ${entry.endTime}` });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 transition-all absolute top-1 right-1 cursor-pointer"
                              title="Delete Block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate pr-3 mb-1.5">
                            {sub?.name || 'Academic Block'}
                          </h4>

                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 dark:bg-indigo-400/5 py-1 px-1.5 rounded-md border border-indigo-500/10">
                            <Clock className="w-3 h-3" />
                            <span>{entry.startTime} - {entry.endTime}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-[11px]">
                      No classes
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
              Add Timetable Block
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Day of Week</label>
                <select
                  value={day}
                  onChange={(e: any) => setDay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time (HH:MM)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Time (HH:MM)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors mt-2"
              >
                Save Schedule Block
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Clock className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Class Block?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{entryToDelete.name}"</span> on <span className="font-semibold">{entryToDelete.day} ({entryToDelete.time})</span> from your timetable? This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTimetableEntry(entryToDelete.id);
                  setEntryToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Block
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
