import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, MessageSquare, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface StudentPdfComment {
  id: string;
  pageNumber: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
  text: string;
  creatorName: string;
  creatorRole: string;
  status: 'pending' | 'addressed' | 'resolved';
  created: string;
  studentResponse?: string;
}

interface StudentPdfCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  selectedComment: StudentPdfComment | null;
  allComments?: StudentPdfComment[];
}

export default function StudentPdfCommentModal({
  isOpen,
  onClose,
  pdfUrl,
  selectedComment,
  allComments = [],
}: StudentPdfCommentModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const pageRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Navigate to selected comment's page when modal opens
  useEffect(() => {
    if (isOpen && selectedComment) {
      setCurrentPage(selectedComment.pageNumber);
      setZoom(1.2); // Slightly zoomed in to see the highlight better
    }
  }, [isOpen, selectedComment]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Center scroll when page changes
  useEffect(() => {
    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const getCommentsOnPage = (page: number) => {
    return allComments.filter((c) => c.pageNumber === page);
  };

  const getHighlightClasses = (comment: StudentPdfComment, isSelected: boolean) => {
    if (isSelected) {
      return 'border-red-500 bg-red-400/40 ring-4 ring-red-300 animate-pulse';
    }
    switch (comment.status) {
      case 'pending':
        return 'border-yellow-500 bg-yellow-300/30';
      case 'addressed':
        return 'border-blue-600 bg-blue-300/25';
      case 'resolved':
        return 'border-green-600 bg-green-300/20';
      default:
        return 'border-gray-400 bg-gray-300/20';
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl h-[90vh] bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Comment Location</h2>
                  <p className="text-red-100 text-sm">
                    {selectedComment
                      ? `Page ${selectedComment.pageNumber} • ${selectedComment.creatorName}`
                      : 'View highlighted areas'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Previous</span>
                </button>
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-bold text-red-600">
                    Page {currentPage} of {numPages}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
                  disabled={currentPage === numPages}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  aria-label="Next page"
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-semibold min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div
              ref={pdfContainerRef}
              className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc',
              }}
            >
              {!pdfUrl ? (
                <div className="flex items-center justify-center h-full">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md border-2 border-red-200"
                  >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No PDF Available</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      A PDF hasn't been generated for this document yet. Please generate a PDF first to view the highlighted comment locations.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-medium">
                        💡 Tip: Use the "Generate PDF" button in the toolbar to create a PDF version of your document.
                      </p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="flex justify-center min-h-full">
                  <div ref={pageRef} className="relative inline-block shadow-2xl rounded-lg overflow-hidden">
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      className="flex justify-center"
                      loading={
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg">
                          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-600 font-medium">Loading PDF...</p>
                        </div>
                      }
                      error={
                        <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg border-2 border-red-200">
                          <MessageSquare className="w-16 h-16 text-red-400 mb-4" />
                          <p className="text-red-600 font-semibold">Failed to load PDF</p>
                          <p className="text-red-500 text-sm mt-2">The PDF file may be missing or corrupted</p>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        scale={zoom}
                        width={Math.min(850, window.innerWidth * 0.6)}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-2xl"
                      />
                    </Document>

                    {/* Render comment highlights */}
                    {getCommentsOnPage(currentPage).map((comment, idx) => {
                      if (!pageRef.current) return null;
                      const rect = pageRef.current.getBoundingClientRect();
                      const pageWidth = rect.width;
                      const pageHeight = rect.height;
                      
                      const isSelected = selectedComment?.id === comment.id;

                      return (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`absolute border-3 ${getHighlightClasses(comment, isSelected)} cursor-pointer transition-all hover:shadow-xl`}
                          style={{
                            left: `${(comment.x / 100) * pageWidth}px`,
                            top: `${(comment.y / 100) * pageHeight}px`,
                            width: `${(comment.width / 100) * pageWidth}px`,
                            height: `${(comment.height / 100) * pageHeight}px`,
                            zIndex: isSelected ? 20 : 10,
                          }}
                        >
                          {/* Comment number badge */}
                          <div
                            className={`absolute -top-8 -left-2 ${
                              isSelected
                                ? 'bg-red-600 ring-2 ring-red-300'
                                : 'bg-gray-800'
                            } text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg`}
                          >
                            {idx + 1}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Comment Info */}
            {selectedComment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-50 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900">{selectedComment.creatorName}</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                        {selectedComment.creatorRole.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedComment.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : selectedComment.status === 'addressed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {selectedComment.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{selectedComment.text}</p>
                    {selectedComment.studentResponse && (
                      <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Your Response:</p>
                        <p className="text-sm text-gray-700">{selectedComment.studentResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
