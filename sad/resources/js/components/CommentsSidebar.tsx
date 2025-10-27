import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ChevronRight, AlertCircle, Send } from 'lucide-react';
import CommentCard, { CommentCardData } from '@/components/CommentCard';
import StudentPdfCommentModal, { StudentPdfComment } from '@/components/StudentPdfCommentModal';
import axios from 'axios';
import { toast } from 'react-toastify';

interface CommentsSidebarProps {
  requestId: number;
  requestType: 'activity_plan' | 'budget_request';
  pdfUrl: string;
  isVisible: boolean;
  onToggle: () => void;
}

export default function CommentsSidebar({ 
  requestId, 
  requestType, 
  pdfUrl, 
  isVisible, 
  onToggle 
}: CommentsSidebarProps) {
  const [comments, setComments] = useState<CommentCardData[]>([]);
  const [selectedComment, setSelectedComment] = useState<CommentCardData | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [hideBtnFading, setHideBtnFading] = useState(false);

  // Lock body scroll when sidebar is visible
  useEffect(() => {
    if (isVisible) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isVisible]);

  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/pdf-comments/${requestType}/${requestId}`);
        if (response.data?.comments) {
          const transformed: CommentCardData[] = response.data.comments.map((c: any) => ({
            id: c.id || `comment-${Date.now()}-${Math.random()}`,
            pageNumber: c.pageNumber,
            x: c.target?.selector?.x || 0,
            y: c.target?.selector?.y || 0,
            width: c.target?.selector?.width || 0,
            height: c.target?.selector?.height || 0,
            text: c.body?.value || '',
            creatorName: c.body?.creator?.name || 'Approver',
            creatorRole: c.body?.creator?.role || 'approver',
            status: c.status || 'pending',
            created: c.body?.created || new Date().toISOString(),
            studentResponse: c.studentResponse,
          }));
          setComments(transformed);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchComments();
    }
  }, [requestId, requestType]);

  const handleCommentClick = (comment: CommentCardData) => {
    setSelectedComment(comment);
    setShowPdfModal(true);
  };

  // Reset hide button fade state whenever the sidebar becomes visible
  useEffect(() => {
    if (isVisible) {
      setHideBtnFading(false);
    }
  }, [isVisible]);

  const submitReply = async (commentId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    try {
      await axios.post(`/api/pdf-comments/${commentId}/respond`, { response: replyText });
      // Update local state
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, status: 'addressed', studentResponse: replyText } : c));
      setReplyText('');
      setReplyingToId(null);
      toast.success('Response submitted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit response');
    }
  };

  const pendingCount = comments.filter(c => c.status === 'pending').length;
  const addressedCount = comments.filter(c => c.status === 'addressed').length;
  const resolvedCount = comments.filter(c => c.status === 'resolved').length;

  // Transform comments to StudentPdfComment format for the modal
  const transformedComments: StudentPdfComment[] = comments.map(c => ({
    id: c.id,
    pageNumber: c.pageNumber,
    x: c.x || 0,
    y: c.y || 0,
    width: c.width || 0,
    height: c.height || 0,
    text: c.text,
    creatorName: c.creatorName,
    creatorRole: c.creatorRole,
    status: c.status,
    created: c.created,
    studentResponse: c.studentResponse,
  }));

  return (
    <>
      {/* PDF Modal */}
      <StudentPdfCommentModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        pdfUrl={pdfUrl}
        selectedComment={selectedComment ? transformedComments.find(c => c.id === selectedComment.id) || null : null}
        allComments={transformedComments}
      />

      {/* Floating Show button (only when sidebar is hidden) */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onToggle}
          className={`fixed top-32 right-0 z-40 bg-red-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-red-700 transition-all duration-300 flex items-center gap-2`}
          title={'Show Comments'}
        >
          {comments.length > 0 && (
            <span className="bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {comments.length}
            </span>
          )}
          <span className="text-sm font-semibold">Comments</span>
          <MessageSquare className="w-5 h-5" />
        </motion.button>
      )}

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-[400px] bg-white border-l border-gray-200 shadow-2xl z-30 flex flex-col"
          >
            {/* Edge-attached Hide button */}
            <button
              onClick={(e) => { e.stopPropagation(); setHideBtnFading(true); onToggle(); }}
              className={`absolute top-1/2 -translate-y-1/2 left-0 -translate-x-full z-40 bg-red-600 text-white px-3 py-2 rounded-l-lg rounded-r-none shadow-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 ${hideBtnFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              title="Hide Comments"
            >
              <span className="text-sm font-semibold">Hide</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Review Feedback</h2>
                  <p className="text-xs text-red-100">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-red-800 rounded-lg transition"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statistics */}
            {comments.length > 0 && (
              <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-yellow-600">{pendingCount}</div>
                  <div className="text-xs text-yellow-700">Pending</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-blue-600">{addressedCount}</div>
                  <div className="text-xs text-blue-700">Addressed</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-green-600">{resolvedCount}</div>
                  <div className="text-xs text-green-700">Resolved</div>
                </div>
              </div>
            )}

            {/* Info Banner */}
            {comments.length > 0 && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">Click a comment card below to reply.</p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-600">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center"
                >
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">No Comments Yet</h3>
                  <p className="text-xs text-gray-500">
                    Approver feedback will appear here once your submission is reviewed.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CommentCard
                        comment={comment}
                        isSelected={selectedComment?.id === comment.id}
                        onClick={() => handleCommentClick(comment)}
                        isStudent={true}
                        onReplyClick={(e?: any) => {
                          setReplyingToId(comment.id);
                          setReplyText(comment.studentResponse || '');
                          setSelectedComment(comment);
                        }}
                      />

                      {/* Inline reply editor (only when replying to this card) */}
                      {replyingToId === comment.id && (
                        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                          <div>
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none"
                              rows={3}
                              placeholder="Write your response..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <button
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                onClick={() => { setReplyingToId(null); setReplyText(''); }}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                                onClick={() => submitReply(comment.id)}
                              >
                                <Send className="w-4 h-4" /> Submit Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
