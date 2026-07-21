import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Plus, Trash2, Edit3, X, Save, AlertCircle } from 'lucide-react';

export default function Notes() {
  const {
    subjects,
    notes,
    addNote,
    editNote,
    deleteNote
  } = useApp();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [isAdding, setIsAdding] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);

  // Form / Editor states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [content, setContent] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !content) return;

    addNote(subjectId, title, content);

    // Reset Form
    setTitle('');
    setSubjectId('');
    setContent('');
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!activeNote) return;
    editNote(activeNote.id, activeNote.title, activeNote.content);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Lecture Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Summarize lectures, compile definitions, and prepare study materials in one place.</p>
        </div>
        <button
          onClick={() => {
            setTitle('');
            setSubjectId(subjects[0]?.id || '');
            setContent('');
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors animate-fade-in"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main split-screen editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Notes list */}
        <div className="lg:col-span-1 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">Available Notes ({notes.length})</div>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {notes.length > 0 ? (
              notes.map(n => {
                const sub = subjects.find(s => s.id === n.subjectId);
                const isActive = n.id === activeNoteId;

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setActiveNoteId(n.id);
                      setIsAdding(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-600'
                        : 'bg-slate-50/30 dark:bg-slate-950/10 border-slate-150 dark:border-slate-850 hover:border-slate-250'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase" style={{ backgroundColor: sub?.color || '#cbd5e1' }}>
                        {sub?.code || 'CLASS'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete(n);
                        }}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs tracking-tight truncate">
                      {n.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 block mt-1 truncate">{n.content}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                <p className="text-xs">No lecture notes found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Split Screen Editor */}
        <div className="lg:col-span-2">
          {activeNote && !isAdding ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => editNote(activeNote.id, e.target.value, activeNote.content)}
                      className="text-base font-extrabold text-slate-900 dark:text-white bg-transparent focus:outline-none focus:border-b focus:border-indigo-500/50 w-64 md:w-80"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Last updated: {new Date(activeNote.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg animate-fade-in">
                      Note saved! ✓
                    </span>
                  )}
                  <button
                    onClick={handleUpdate}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  value={activeNote.content}
                  onChange={(e) => editNote(activeNote.id, activeNote.title, e.target.value)}
                  rows={15}
                  className="w-full bg-slate-50/20 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 p-4 rounded-xl border border-slate-150 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 font-sans text-xs leading-relaxed"
                  placeholder="Type notes here..."
                />
              </div>

            </div>
          ) : isAdding ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>Create New Lecture Note</span>
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                      required
                    >
                      <option value="" disabled>Select Course</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Note Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Chapter 4: Matrix Transformations"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Content / Document Summary</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter study summaries, lecture slides summaries, key vocabulary definitions, practice questions..."
                    rows={12}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-sans"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                  >
                    Create Note File
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-sm h-full flex flex-col items-center justify-center min-h-[40vh]">
              <FileText className="w-16 h-16 mb-3 text-indigo-500 opacity-20" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200">No Note Selected</h3>
              <p className="text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                Click on any note block on the left panel to open, view, edit or delete notes. Or click **New Note** to author another study summary.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Lecture Note?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{noteToDelete.title}"</span>? This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteNote(noteToDelete.id);
                  if (activeNoteId === noteToDelete.id) setActiveNoteId(null);
                  setNoteToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
