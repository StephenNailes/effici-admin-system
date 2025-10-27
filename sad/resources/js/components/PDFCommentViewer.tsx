import React, { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { MessageSquare, Check, Send } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Export a named type to share with wrappers without colliding with DOM's Comment type
export interface PdfViewerComment {
  id: string;
  pageNumber: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
  text: string;
  created: string;
  creatorName: string;
  creatorRole: string;
  status: 'pending' | 'addressed' | 'resolved';
  studentResponse?: string;
}

interface PDFCommentViewerProps {
  pdfUrl: string;
  requestId: number;
  requestType: 'activity_plan' | 'budget_request';
  isApprover: boolean;
  onSaveComments?: (comments: PdfViewerComment[]) => Promise<void> | void;
  existingComments?: PdfViewerComment[];
  selectedCommentId?: string; // ID of comment to auto-select and navigate to
}

export default function PDFCommentViewer({
  pdfUrl,
  requestId,
  requestType,
  isApprover,
  onSaveComments,
  existingComments = [],
  selectedCommentId
}: PDFCommentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [comments, setComments] = useState<PdfViewerComment[]>(existingComments);
  const [selectedComment, setSelectedComment] = useState<PdfViewerComment | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isCommentMode, setIsCommentMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageRendered, setPageRendered] = useState(false);
  
  // Rectangle drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Update comments when existingComments prop changes
  useEffect(() => {
    setComments(existingComments);
  }, [existingComments]);

  // Auto-select and navigate to comment if selectedCommentId is provided
  useEffect(() => {
    if (selectedCommentId && comments.length > 0) {
      const comment = comments.find(c => c.id === selectedCommentId);
      if (comment) {
        setCurrentPage(comment.pageNumber);
        setSelectedComment(comment);
      }
    }
  }, [selectedCommentId, comments]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Center and reset scroll when opening or changing page
  useEffect(() => {
    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    setPageRendered(false);
  }, [currentPage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCommentMode || !pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = currentX - drawStart.x;
    const height = currentY - drawStart.y;
    
    setCurrentRect({
      x: width < 0 ? currentX : drawStart.x,
      y: height < 0 ? currentY : drawStart.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    // Convert pixels to percentages
    const xPct = (currentRect.x / containerWidth) * 100;
    const yPct = (currentRect.y / containerHeight) * 100;
    const widthPct = (currentRect.width / containerWidth) * 100;
    const heightPct = (currentRect.height / containerHeight) * 100;
    
    // Only create comment if rectangle is big enough
    if (widthPct > 1 && heightPct > 1) {
      const newComment: PdfViewerComment = {
        id: `comment-${Date.now()}`,
        pageNumber: currentPage,
        x: xPct,
        y: yPct,
        width: widthPct,
        height: heightPct,
        text: '',
        created: new Date().toISOString(),
        creatorName: 'Current User',
        creatorRole: 'approver',
        status: 'pending',
      };
      
      setComments(prev => [...prev, newComment]);
      setSelectedComment(newComment);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  const updateCommentText = (commentId: string, text: string) => {
    setComments(prev =>
      prev.map(c =>
        c.id === commentId ? { ...c, text } : c
      )
    );
  };

  const deleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    if (selectedComment?.id === commentId) {
      setSelectedComment(null);
    }
  };

  const handleStudentResponse = async (commentId: string) => {
    if (!responseText.trim()) return;

    try {
      const response = await fetch(`/api/pdf-comments/${commentId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ response: responseText }),
      });

      if (response.ok) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? { ...c, status: 'addressed', studentResponse: responseText }
              : c
          )
        );
        setResponseText('');
        setSelectedComment(null);
      }
    } catch (error) {
      console.error('Error responding to comment:', error);
      alert('Failed to save response. Please try again.');
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/pdf-comments/${commentId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        setComments(prev =>
          prev.map(c => (c.id === commentId ? { ...c, status: 'resolved' } : c))
        );
        setSelectedComment(null);
      } else if (response.status === 403) {
        alert('Only the original approver can resolve this comment.');
      } else {
        const text = await response.text();
        console.error('Failed to resolve comment:', text);
        alert('Failed to resolve comment. Please try again.');
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment. Please check your connection and try again.');
    }
  };

  const handleSaveComments = async () => {
    if (!onSaveComments) return;
    
    // Validate all comments have text
    const emptyComments = comments.filter(c => !c.text.trim());
    if (emptyComments.length > 0) {
      alert('Please add text to all comments before saving.');
      return;
    }
    
    setIsSaving(true);
    try {
      const maybePromise = onSaveComments(comments);
      if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
        await (maybePromise as Promise<void>);
      }
      setIsCommentMode(false);
    } catch (error) {
      console.error('Error saving comments:', error);
      alert('Failed to save comments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCommentsByPage = (page: number) => {
    return comments.filter(c => c.pageNumber === page);
  };

  // Navigate to comment's page when clicked in sidebar
  const handleCommentClick = (comment: PdfViewerComment) => {
    if (comment.pageNumber !== currentPage) {
      setCurrentPage(comment.pageNumber);
    }
    setSelectedComment(comment);
  };

  // Styling helpers for overlays and chips
  const getOverlayClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500 bg-yellow-300/25';
      case 'addressed':
        return 'border-green-600 bg-green-300/20';
      case 'resolved':
        return 'border-blue-600 bg-blue-300/20';
      default:
        return 'border-gray-400 bg-gray-300/20';
    }
  };

  const getChipClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-900 border border-yellow-300';
      case 'addressed':
        return 'bg-green-100 text-green-900 border border-green-300';
      case 'resolved':
        return 'bg-blue-100 text-blue-900 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-900 border border-gray-300';
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* PDF Viewer with Manual Annotation */}
      <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
              disabled={currentPage === numPages}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>

          {isApprover && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCommentMode(!isCommentMode)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${
                  isCommentMode
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {isCommentMode ? 'Cancel Comments' : 'Add Comments'}
              </button>

              {comments.length > 0 && (
                <button
                  onClick={handleSaveComments}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-md transition-all"
                >
                  {isSaving ? 'Saving...' : `Save ${comments.length} Comments`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* PDF with drawing overlay - NOW SCROLLABLE */}
        <div 
          ref={pdfContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-6 bg-gray-100"
          style={{ 
            cursor: isCommentMode ? 'crosshair' : 'default',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="flex justify-center min-h-full">
            <div ref={pageRef} className="relative inline-block">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="flex justify-center shadow-xl"
              >
                <Page
                  pageNumber={currentPage}
                  width={Math.min(850, window.innerWidth * 0.5)}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-2xl"
                  onRenderSuccess={() => setPageRendered(true)}
                />
              </Document>

            {/* Current drawing rectangle */}
            {isDrawing && currentRect && (
              <div
                className="absolute border-2 border-blue-600 bg-blue-300/25 pointer-events-none"
                style={{
                  left: `${currentRect.x}px`,
                  top: `${currentRect.y}px`,
                  width: `${currentRect.width}px`,
                  height: `${currentRect.height}px`,
                }}
              />
            )}

            {/* Render existing comments as overlays */}
            {pageRendered && getCommentsByPage(currentPage).map((comment, idx) => {
              return (
                <div
                  key={comment.id}
                  className={`absolute border-2 ${getOverlayClasses(comment.status)} cursor-pointer transition-all`}
                  style={{
                    left: `${comment.x}%`,
                    top: `${comment.y}%`,
                    width: `${comment.width}%`,
                    height: `${comment.height}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComment(comment);
                  }}
                >
                  <div className="absolute -top-6 -left-1 bg-white text-black border border-gray-300 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    {idx + 1}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {isCommentMode && (
          <div className="bg-blue-50 border-t border-blue-200 p-2 text-center text-sm text-blue-700">
            <strong>Draw rectangles</strong> on the PDF to add comments
          </div>
        )}
      </div>

      {/* Comments Sidebar */}
      <div className="w-96 border border-gray-300 rounded-lg bg-white overflow-hidden flex flex-col">
        <div className="bg-gray-100 border-b border-gray-200 p-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No comments yet</p>
              {isApprover && (
                <p className="text-sm mt-1">Click "Add Comments" to start</p>
              )}
            </div>
          ) : (
            comments.map((comment, idx) => (
              <div
                key={comment.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedComment?.id === comment.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCommentClick(comment)}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs text-gray-500">
                        Page {comment.pageNumber}
                      </p>
                      <p className="text-xs font-semibold text-gray-700">
                        {comment.creatorName || 'Approver'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getChipClasses(comment.status)}`}>
                      {comment.status}
                    </span>
                    {isApprover && !comment.studentResponse && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComment(comment.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-xs font-bold px-1"
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                {isApprover && selectedComment?.id === comment.id ? (
                  <textarea
                    className="w-full p-2 border rounded text-sm outline-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter your comment..."
                    value={comment.text}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateCommentText(comment.id, e.target.value)}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-black mb-2 whitespace-pre-wrap">{comment.text}</p>
                )}

                {/* Student Response */}
                {comment.studentResponse && (
                  <div className="mt-2 pl-4 border-l-2 border-blue-400 bg-blue-50 p-2 rounded">
                    <p className="text-xs font-semibold text-blue-600">Student Response:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.studentResponse}</p>
                  </div>
                )}

                {/* Student Response Input */}
                {!isApprover && comment.status === 'pending' && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      className="w-full p-2 border rounded text-sm outline-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Enter your response..."
                      value={selectedComment?.id === comment.id ? responseText : ''}
                      onChange={(e) => {
                        setSelectedComment(comment);
                        setResponseText(e.target.value);
                      }}
                    />
                    <button
                      onClick={() => handleStudentResponse(comment.id)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Submit Response
                    </button>
                  </div>
                )}

                {/* Approver Actions - ONLY FOR APPROVERS */}
                {isApprover && comment.studentResponse && comment.status === 'addressed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolveComment(comment.id);
                    }}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark as Resolved
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
