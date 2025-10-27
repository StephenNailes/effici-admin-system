import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/layouts/mainlayout';
import { ArrowLeft, Check, Download, Maximize2, Users, X, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import PDFPreviewModal from '@/components/PDFPreviewModal';
import AddPdfCommentsModal from '@/components/AddPdfCommentsModal';

interface Props { id: number }

export default function BudgetRequestApproval({ id }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [showCommentViewer, setShowCommentViewer] = useState(false);

  const pdfUrl = useMemo(() => {
    const url = data?.pdf_url;
    if (!url) return '';
    // keep simple first-page fit like ActivityPlanApproval
    return `${url}#page=1&view=FitH&toolbar=0&navpanes=0`;
  }, [data?.pdf_url]);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/approvals/${id}`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load budget request'))
      .finally(() => setLoading(false));
  }, [id]);

  const goBack = () => router.visit('/admin/requests');

  const approve = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/approvals/${id}/approve`);
      toast.success('Forwarded to next approver.');
      goBack();
    } catch (e) {
      toast.error('Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const requestRevision = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/approvals/${id}/revision`, { remarks });
      toast.info('Revision requested.');
      goBack();
    } catch (e) {
      toast.error('Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading budget request...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Budget request not found.</div>
        </div>
      </MainLayout>
    );
  }

  const priority = (data.priority || data.category || '').toLowerCase();
  const status = data.approval_status || data.status || 'pending';

  return (
    <MainLayout>
      <motion.div
        className="min-h-screen font-poppins"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Header */}
        <motion.div
          className="px-6 py-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className="rounded-xl shadow-md bg-white/80 backdrop-blur border border-gray-200 p-5 flex items-center gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Budget Request Approval</h1>
              <p className="text-xs text-gray-500">Review the first page, open full PDF as needed, then approve or request revisions.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-1 pb-8">
          {/* Left Side - Document Viewer */}
          <div className="flex-1 p-6">
            <motion.div
              className="bg-white rounded-lg shadow-xl h-full min-h-[680px] max-w-[794px] mx-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Document Header */}
              <motion.div
                className="border-b border-gray-100 p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Budget Request</h2>
                  <div className="flex items-center gap-2">
                    {data?.pdf_url && (
                      <a
                        href={data.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    {data?.pdf_url && (
                      <button
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        aria-label="View"
                        onClick={() => setShowPdf(true)}
                      >
                        <Maximize2 className="w-4 h-4" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Document Preview */}
              <div className="p-6 h-full overflow-y-auto">
                <motion.div
                  className="bg-transparent p-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {data?.pdf_url ? (
                    <div className="flex justify-center">
                      {/* A4 page container: max width ~794px at 96dpi with A4 aspect ratio */}
                      <div className="relative bg-white shadow-xl border rounded-sm overflow-hidden w-full max-w-[794px] aspect-[210/297]">
                        <iframe
                          src={pdfUrl}
                          className="absolute inset-0 w-full h-full border-0"
                          title="Budget Request First Page"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="relative bg-white shadow-xl border rounded-sm overflow-hidden w-full max-w-[794px] aspect-[210/297] flex items-center justify-center text-gray-500">
                        No PDF submitted for this budget request.
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Details & Actions */}
          <div className="w-96 p-6">
            <div className="space-y-6">
              {/* Organization Card (optional/placeholder) */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>{data.organization || '—'}</span>
                </div>
              </motion.div>

              {/* Submission Details Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Submitted by</span>
                    <span className="text-gray-900 font-medium">{data.student_name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status === 'revision_requested' ? 'Under Revision' : String(status)}
                    </span>
                  </div>
                  {data.submitted_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Submitted on</span>
                      <span className="text-gray-900 font-medium">{new Date(data.submitted_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {(data.priority || data.category) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Priority</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '—'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Removed inline remarks in favor of structured PDF comments */}

              {/* Actions Card */}
              {status === 'pending' && (
                <motion.div
                  className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowCommentViewer(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Add PDF Comments
                    </button>
                    <button
                      onClick={approve}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {submitting ? 'Processing...' : 'Approve Request'}
                    </button>

                    <button
                      onClick={requestRevision}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      {submitting ? 'Processing...' : 'Request Revision'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* PDF View Modal */}
      <PDFPreviewModal
        isOpen={showPdf}
        pdfUrl={data?.pdf_url || null}
        onClose={() => setShowPdf(false)}
        onDownload={data?.pdf_url ? () => window.open(data.pdf_url, '_blank') : undefined}
        title="Budget Request PDF"
      />

      {/* PDF Comment Viewer Modal - centralized component */}
      {data?.pdf_url && (
        <AddPdfCommentsModal
          isOpen={showCommentViewer}
          onClose={() => setShowCommentViewer(false)}
          pdfUrl={data.pdf_url}
          requestId={data.request_id}
          requestType="budget_request"
          isApprover={true}
          onSaveComments={async (comments) => {
            try {
              const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';
              await axios.post(`/api/approvals/${id}/comments`, {
                comments: comments.map(c => ({
                  page_number: c.pageNumber,
                  region_x1_pct: c.x,
                  region_y1_pct: c.y,
                  region_x2_pct: c.x + c.width,
                  region_y2_pct: c.y + c.height,
                  comment_text: c.text,
                }))
              }, {
                withCredentials: true,
                headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRF-TOKEN': csrf,
                  'Content-Type': 'application/json'
                }
              });
              toast.success('Comments saved successfully!');
              setShowCommentViewer(false);
            } catch (error) {
              console.error('Error saving comments:', error);
              toast.error('Failed to save comments. Please try again.');
            }
          }}
        />
      )}
    </MainLayout>
  );
}
