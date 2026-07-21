import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Eye, Folder, Trash2, Upload, X, FileText, Sparkles, AlertCircle } from 'lucide-react';
import PdfViewerComponent from './PdfViewerComponent';

export default function PdfVault() {
  const {
    subjects,
    pdfs,
    uploadPDF,
    deletePDFFile
  } = useApp();

  const [subjectId, setSubjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<any | null>(null);
  
  // Custom alerts states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfToDelete, setPdfToDelete] = useState<any | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('Invalid file format. Only PDF files are accepted.');
      setSelectedFile(null);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await uploadPDF(subjectId, selectedFile);
      setSelectedFile(null);
      setSubjectId('');
      setSuccessMessage('PDF uploaded successfully to Vault! 🔒');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to upload PDF. Please try again.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setUploading(false);
    }
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Secure PDF Vault</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload syllabus slides, textbooks, homework checklists, and course PDFs. Organized cleanly by subject.</p>
      </div>

      {/* Grid: Upload & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Upload Document</span>
          </h3>

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-900/10 animate-fade-in flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/10 animate-fade-in flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Associate Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                required
              >
                <option value="" disabled>Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/80 rounded-xl text-center bg-slate-50/20 dark:bg-slate-950/20 relative cursor-pointer group transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {selectedFile ? selectedFile.name : 'Choose Syllabus PDF'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Saves securely to local Sandbox'}
              </span>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  Saving Vault...
                </>
              ) : (
                'Save to Vault'
              )}
            </button>
          </form>
        </div>

        {/* Right Side: PDF Files inventory */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Vault Inventory ({pdfs.length} files)</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {pdfs.length > 0 ? (
              pdfs.map(p => {
                const sub = subjects.find(s => s.id === p.subjectId);

                return (
                  <div key={p.id} className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/15 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: sub?.color || '#cbd5e1' }}>
                          {sub?.code || 'CLASS'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate leading-snug">{p.name}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{p.size} • Uploaded {p.uploadDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleViewPdf(p)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="View PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(p)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPdfToDelete(p)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16 text-slate-400">
                <Folder className="w-16 h-16 mx-auto mb-3 opacity-30 text-indigo-500" />
                <p className="text-xs">Your secure PDF vault is empty. Upload Syllabus files, textbooks, or notes above!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PDF View Modal Overlay */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
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

      {/* Delete Confirmation Modal */}
      {pdfToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Document?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{pdfToDelete.name}"</span> from your secure PDF vault? This action is permanent.
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
