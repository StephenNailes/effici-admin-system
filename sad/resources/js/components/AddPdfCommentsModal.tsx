import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PDFCommentViewer, { PdfViewerComment } from '@/components/PDFCommentViewer';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  requestId: number | string;
  requestType: 'activity_plan' | 'budget_request';
  isApprover?: boolean;
  onSaveComments: (comments: PdfViewerComment[]) => Promise<void> | void;
  title?: string;
  selectedCommentId?: string; // For auto-navigating to a specific comment
}

export default function AddPdfCommentsModal({ isOpen, onClose, pdfUrl, requestId, requestType, isApprover = true, onSaveComments, title = 'Add Comments', selectedCommentId }: Props) {
  const [existingComments, setExistingComments] = useState<PdfViewerComment[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing comments when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/pdf-comments/${requestType}/${requestId}`);
        if (response.data?.comments) {
          // Transform backend shape to PdfViewerComment
          const transformed: PdfViewerComment[] = response.data.comments.map((c: any) => ({
            id: c.id || `comment-${Date.now()}-${Math.random()}`,
            pageNumber: c.pageNumber,
            x: c.target?.selector?.x || 0,
            y: c.target?.selector?.y || 0,
            width: c.target?.selector?.width || 0,
            height: c.target?.selector?.height || 0,
            text: c.body?.value || '',
            created: c.body?.created || new Date().toISOString(),
            creatorName: c.body?.creator?.name || 'Unknown',
            creatorRole: c.body?.creator?.role || 'approver',
            status: c.status || 'pending',
            studentResponse: c.studentResponse,
          }));
          setExistingComments(transformed);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, requestId, requestType]);

  // Lock/unlock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-7xl h-[85vh] bg-white text-black rounded-lg overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            {/* Content (scrolls within modal) */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading comments...</p>
                  </div>
                </div>
              ) : (
                <PDFCommentViewer
                  pdfUrl={pdfUrl}
                  requestId={Number(requestId)}
                  requestType={requestType}
                  isApprover={isApprover}
                  onSaveComments={onSaveComments}
                  existingComments={existingComments}
                  selectedCommentId={selectedCommentId}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
