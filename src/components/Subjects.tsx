import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Calendar, CheckSquare, Edit3, Folder, Plus, Trash2, X, FileText, Upload, Sparkles, Download, Eye, AlertCircle } from 'lucide-react';
import PdfViewerComponent from './PdfViewerComponent';

export default function Subjects() {
  const {
    subjects,
    notes,
    assignments,
    quizzes,
    exams,
    pdfs,
    addSubject,
    editSubject,
    deleteSubject,
    addNote,
    addAssignment,
    addQuiz,
    uploadPDF,
    deletePDFFile
  } = useApp();

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<any | null>(null);
  const [pdfToDelete, setPdfToDelete] = useState<any | null>(null);
  
  // Subject form state
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subColor, setSubColor] = useState('#4F46E5');

  // New item triggers within subject detail hub
  const [activeSection, setActiveSection] = useState<'notes' | 'pdfs' | 'assignments' | 'quizzes'>('notes');
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Item form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDue, setAsgDue] = useState('');
  const [asgPriority, setAsgPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [asgTotalMarks, setAsgTotalMarks] = useState(100);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDate, setQuizDate] = useState('');
  const [quizTotalMarks, setQuizTotalMarks] = useState(10);
  const [pdfUploadFile, setPdfUploadFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  // Active Subject Detail Filter
  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const filteredNotes = notes.filter(n => n.subjectId === activeSubjectId);
  const filteredAssignments = assignments.filter(a => a.subjectId === activeSubjectId);
  const filteredQuizzes = quizzes.filter(q => q.subjectId === activeSubjectId);
  const filteredPdfs = pdfs.filter(p => p.subjectId === activeSubjectId);

  // PDF Viewer Modal State
  const [viewingPdf, setViewingPdf] = useState<any | null>(null);

  const colors = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#64748B'];

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subCode) return;
    addSubject(subName, subCode, subColor);
    setSubName('');
    setSubCode('');
    setIsAddingSubject(false);
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingSubject || !subName || !subCode) return;
    editSubject(isEditingSubject, subName, subCode, subColor);
    setSubName('');
    setSubCode('');
    setIsEditingSubject(null);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubjectId) return;

    if (activeSection === 'notes') {
      if (!noteTitle || !noteContent) return;
      addNote(activeSubjectId, noteTitle, noteContent);
      setNoteTitle('');
      setNoteContent('');
    } else if (activeSection === 'assignments') {
      if (!asgTitle || !asgDue) return;
      addAssignment({
        subjectId: activeSubjectId,
        title: asgTitle,
        dueDate: asgDue,
        status: 'pending',
        priority: asgPriority,
        totalMarks: Number(asgTotalMarks)
      });
      setAsgTitle('');
      setAsgDue('');
    } else if (activeSection === 'quizzes') {
      if (!quizTitle || !quizDate) return;
      addQuiz({
        subjectId: activeSubjectId,
        title: quizTitle,
        date: quizDate,
        totalMarks: Number(quizTotalMarks)
      });
      setQuizTitle('');
      setQuizDate('');
    } else if (activeSection === 'pdfs') {
      if (!pdfUploadFile) return;
      setPdfUploading(true);
      try {
        await uploadPDF(activeSubjectId, pdfUploadFile);
        setPdfUploadFile(null);
      } catch (err) {
        console.error(err);
      } finally {
        setPdfUploading(false);
      }
    }
    setIsAddingItem(false);
  };

  const handleViewPdf = (pdf: any) => {
    setViewingPdf(pdf);
  };

  const handleClosePdf = () => {
    setViewingPdf(null);
  };

  const handleDownloadPdf = (pdf: any) => {
    let url = pdf.downloadUrl || '';
    let isTemp = false;
    if (!url && pdf.blob) {
      url = URL.createObjectURL(pdf.blob);
      isTemp = true;
    }
    
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = pdf.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (isTemp) {
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } else if (pdf.dataUrl) {
      const link = document.createElement('a');
      link.href = pdf.dataUrl;
      link.download = pdf.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subjects Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Academic Subjects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add, configure, and manage complete resource archives per subject.</p>
        </div>
        <button
          onClick={() => {
            setIsAddingSubject(true);
            setSubName('');
            setSubCode('');
            setSubColor('#4F46E5');
          }}
          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Subjects list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Your Subjects ({subjects.length})</div>
          
          <div className="space-y-2.5">
            {subjects.length > 0 ? (
              subjects.map(s => {
                const subNotesCount = notes.filter(n => n.subjectId === s.id).length;
                const subPdfsCount = pdfs.filter(p => p.subjectId === s.id).length;
                const isActive = s.id === activeSubjectId;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSubjectId(s.id);
                      setIsAddingItem(false);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s.color }}>
                        {s.code}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingSubject(s.id);
                            setSubName(s.name);
                            setSubCode(s.code);
                            setSubColor(s.color);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubjectToDelete(s);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight mb-3 truncate">
                      {s.name}
                    </h3>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {subNotesCount} Notes
                      </span>
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3 text-slate-400" />
                        {subPdfsCount} PDFs
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
                <p className="text-sm font-semibold">No subjects added yet.</p>
                <p className="text-xs max-w-[200px] mx-auto mt-1">Get started by creating your first subject above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right columns - Subject Detail Hub */}
        <div className="lg:col-span-2">
          {activeSubject ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-10 rounded-full" style={{ backgroundColor: activeSubject.color }} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{activeSubject.code}</span>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{activeSubject.name}</h2>
                  </div>
                </div>

                {/* Subnav links */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-850">
                  {(['notes', 'pdfs', 'assignments', 'quizzes'] as const).map(sec => (
                    <button
                      key={sec}
                      onClick={() => {
                        setActiveSection(sec);
                        setIsAddingItem(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        activeSection === sec
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-800'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {sec === 'pdfs' ? 'PDF Vault' : sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Item trigger */}
              {!isAddingItem && (
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="w-full py-3 px-4 border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New {activeSection === 'notes' ? 'Note' : activeSection === 'pdfs' ? 'PDF Upload' : activeSection === 'assignments' ? 'Assignment' : 'Quiz'}</span>
                </button>
              )}

              {/* Add Item Form inline */}
              {isAddingItem && (
                <form onSubmit={handleCreateItem} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-2">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Add {activeSection.slice(0, -1)} to {activeSubject.code}
                    </h4>
                    <button type="button" onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {activeSection === 'notes' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Note Title</label>
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Algorithms & Complexities..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Content</label>
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Write your study notes, formulas, summaries..."
                          rows={4}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-sans"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeSection === 'assignments' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assignment Title</label>
                        <input
                          type="text"
                          value={asgTitle}
                          onChange={(e) => setAsgTitle(e.target.value)}
                          placeholder="Problem Set 1..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                        <input
                          type="date"
                          value={asgDue}
                          onChange={(e) => setAsgDue(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                        <select
                          value={asgPriority}
                          onChange={(e: any) => setAsgPriority(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Marks</label>
                        <input
                          type="number"
                          value={asgTotalMarks}
                          onChange={(e) => setAsgTotalMarks(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeSection === 'quizzes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Quiz Title</label>
                        <input
                          type="text"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          placeholder="Pop Quiz 2: Vectors..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Quiz Date</label>
                        <input
                          type="date"
                          value={quizDate}
                          onChange={(e) => setQuizDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Marks</label>
                        <input
                          type="number"
                          value={quizTotalMarks}
                          onChange={(e) => setQuizTotalMarks(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeSection === 'pdfs' && (
                    <div className="space-y-3">
                      <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-white dark:bg-slate-900 hover:border-indigo-400 transition-colors relative cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const selected = e.target.files?.[0];
                            if (selected) setPdfUploadFile(selected);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {pdfUploadFile ? pdfUploadFile.name : 'Select or Drag & Drop PDF Here'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {pdfUploadFile ? `${(pdfUploadFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max limit 15MB'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingItem(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pdfUploading}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      {pdfUploading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                          Uploading Vault...
                        </>
                      ) : (
                        'Save Record'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Items Render lists */}
              <div className="space-y-3">
                {activeSection === 'notes' && (
                  filteredNotes.length > 0 ? (
                    filteredNotes.map(n => (
                      <div key={n.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{n.title}</h4>
                          <span className="text-[10px] font-medium text-slate-400">{new Date(n.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed whitespace-pre-wrap">{n.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No lecture notes added to this subject yet.</p>
                    </div>
                  )
                )}

                {activeSection === 'assignments' && (
                  filteredAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Title</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Priority</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssignments.map(a => (
                            <tr key={a.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/30">
                              <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{a.title}</td>
                              <td className="py-3 px-3 text-slate-500">{a.dueDate}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  a.priority === 'high' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                                  a.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-850'
                                }`}>
                                  {a.priority}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  a.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No pending assignments for this subject.</p>
                    </div>
                  )
                )}

                {activeSection === 'quizzes' && (
                  filteredQuizzes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Title</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Marks (Obtained/Total)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuizzes.map(q => (
                            <tr key={q.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/30">
                              <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{q.title}</td>
                              <td className="py-3 px-3 text-slate-500">{q.date}</td>
                              <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                {q.obtainedMarks !== undefined ? `${q.obtainedMarks} / ${q.totalMarks}` : `Pending (${q.totalMarks} Total)`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No quizzes logged for this subject yet.</p>
                    </div>
                  )
                )}

                {activeSection === 'pdfs' && (
                  filteredPdfs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredPdfs.map(p => (
                        <div key={p.id} className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{p.name}</h5>
                            <span className="text-[10px] text-slate-400 block">{p.size} • Uploaded {p.uploadDate}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleViewPdf(p)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                              title="View PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(p)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setPdfToDelete(p);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Delete PDF"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <Folder className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No PDFs in this vault yet. Upload slides, syllabi, or homework sheets.</p>
                    </div>
                  )
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-sm h-full flex flex-col items-center justify-center">
              <Folder className="w-16 h-16 mb-3 text-indigo-500 opacity-20" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200">No Subject Selected</h3>
              <p className="text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                Click on any subject in your list to view its complete local archive including notes, syllabus PDFs, grades, homework tracking, and quizzes.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Subject Modals: Create / Edit */}
      {(isAddingSubject || isEditingSubject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 relative">
            <button
              onClick={() => {
                setIsAddingSubject(false);
                setIsEditingSubject(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
              {isEditingSubject ? 'Edit Subject Details' : 'Add Academic Subject'}
            </h3>

            <form onSubmit={isEditingSubject ? handleSaveEditSubject : handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Introduction to Calculus"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Code / Abbreviation</label>
                <input
                  type="text"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="e.g. MATH 101"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject Display Theme</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSubColor(col)}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                        subColor === col ? 'border-slate-850 scale-110 ring-2 ring-indigo-500/10' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors mt-2"
              >
                {isEditingSubject ? 'Save Changes' : 'Add Subject to Hub'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF View Modal Overlay */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[90vh]">
            <PdfViewerComponent
              url={viewingPdf.downloadUrl || viewingPdf.dataUrl || ''}
              blob={viewingPdf.blob}
              name={viewingPdf.name}
              onClose={handleClosePdf}
            />
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Subject?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">"{subjectToDelete.name}"</span>?
              <br /><br />
              This will permanently remove all associated notes, PDFs, assignments, and quiz performance metrics. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSubjectToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSubject(subjectToDelete.id);
                  if (activeSubjectId === subjectToDelete.id) setActiveSubjectId(null);
                  setSubjectToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete PDF Confirmation Modal */}
      {pdfToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Folder className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete PDF File?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{pdfToDelete.name}"</span> from this subject's PDF vault? This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPdfToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePDFFile(pdfToDelete.id);
                  setPdfToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
