import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize, Minimize, Loader2, AlertTriangle } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdfjs worker to use the official Vite-compatible worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerComponentProps {
  url: string;
  blob?: Blob;
  name: string;
  onClose: () => void;
}

export default function PdfViewerComponent({ url, blob, name, onClose }: PdfViewerComponentProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfSource, setPdfSource] = useState<any>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Set the source of the PDF & Handle Object URL lifecycle to prevent memory leaks
  useEffect(() => {
    let activeUrl: string | null = null;
    setError(null);

    if (blob) {
      try {
        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
        setPdfSource(activeUrl);
      } catch (err: any) {
        console.error('Failed to create ObjectURL from blob:', err);
        setError('Failed to process local file stream.');
      }
    } else if (url) {
      setPdfSource(url);
    } else {
      setError("No valid PDF source found.");
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [url, blob]);

  // Handle ResizeObserver on the stable outer container to make react-pdf page responsive
  // and completely eliminate the width-scale conflict (scrollbars loop)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // The outer container width is stable and unaffected by scrollbars
        const newWidth = Math.max(300, Math.floor(entries[0].contentRect.width - 32));
        setContainerWidth(newWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isFullscreen]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('react-pdf load error:', err);
    setError(err.message || 'Failed to load PDF. The file may be corrupt or inaccessible.');
  }

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages));
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const downloadUrl = objectUrl || url;
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none w-full h-full' 
          : 'w-full h-full min-h-[500px]'
      }`}
    >
      {/* Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800 text-white z-10 select-none">
        <div className="flex items-center gap-2 max-w-[50%] md:max-w-[40%]">
          <span className="p-1.5 rounded bg-indigo-600/30 text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <div className="truncate">
            <h4 className="text-xs font-bold truncate" title={name}>{name}</h4>
            {numPages && (
              <span className="text-[10px] text-slate-400">
                Page {pageNumber} of {numPages}
              </span>
            )}
          </div>
        </div>

        {/* Central Controls */}
        <div className="flex items-center gap-1.5 md:gap-3 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-medium min-w-[50px] text-center text-slate-300">
            {pageNumber} / {numPages || '?'}
          </span>

          <button
            onClick={handleNextPage}
            disabled={numPages ? pageNumber >= numPages : true}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom and Secondary Controls */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] min-w-[35px] text-center text-slate-400">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-900 cursor-pointer transition-colors"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-900 cursor-pointer transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 bg-rose-950/45 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-900/30 cursor-pointer transition-colors"
            title="Close Viewer"
          >
            <span className="text-xs font-bold px-1">Close</span>
          </button>
        </div>
      </div>

      {/* Main Document View Canvas Container */}
      <div 
        className="flex-1 overflow-auto bg-slate-950/80 p-4 flex justify-center items-start scrollbar-thin scrollbar-thumb-slate-800"
      >
        {error ? (
          <div className="max-w-md w-full bg-slate-900 border border-red-900/40 rounded-xl p-6 text-center shadow-xl my-12 animate-fade-in mx-auto">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h4 className="text-white font-extrabold text-sm mb-1">Failed to Render Document</h4>
            <p className="text-xs text-slate-400 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Directly
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : !pdfSource ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-xs font-medium">Loading document secure stream...</span>
          </div>
        ) : (
          <div className="relative shadow-2xl bg-white border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-200">
            <Document
              file={pdfSource}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center p-20 text-slate-400 min-w-[300px]">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                  <span className="text-xs font-medium">Opening PDF with pdf.js...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                width={containerWidth}
                loading={
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                    <span className="text-[10px]">Rendering Page...</span>
                  </div>
                }
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
