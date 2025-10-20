import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/layouts/mainlayout";
import { Download, Maximize2, Check, X, ArrowLeft, Users } from "lucide-react";
import axios from "axios";
import { router } from "@inertiajs/react";
import PDFPreviewModal from "@/components/PDFPreviewModal";

interface Props {
  id: string;
}

export default function ActivityPlanApproval({ id }: Props) {
  const [activityPlan, setActivityPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    axios
      .get(`/api/approvals/${id}`)
      .then((res) => {
        setActivityPlan(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading activity plan:", err);
        setLoading(false);
      });
  }, [id]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/approvals/${id}/approve`, {}, {
        withCredentials: true,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      router.visit('/admin/requests');
    } catch (err) {
      console.error('Error approving activity plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevision = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/approvals/${id}/revision`, { remarks }, {
        withCredentials: true,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      router.visit('/admin/requests');
    } catch (err) {
      console.error('Error requesting revision:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading activity plan...</div>
        </div>
      </MainLayout>
    );
  }

  if (!activityPlan) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Activity plan not found.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        className="min-h-screen font-poppins"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div
          className="px-6 py-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="rounded-xl shadow-md bg-white/80 backdrop-blur border border-gray-200 p-5 flex items-center gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <button
              onClick={() => router.visit('/admin/requests')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Activity Plan Approval</h1>
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
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Document Header */}
              <motion.div
                className="border-b border-gray-100 p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Activity Plan Request</h2>
                  <div className="flex items-center gap-2">
                    {activityPlan?.pdf_url && (
                      <a
                        href={activityPlan.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    {activityPlan?.pdf_url && (
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
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {activityPlan?.pdf_url ? (
                    <div className="flex justify-center">
                      {/* A4 page container: max width ~794px at 96dpi with A4 aspect ratio */}
                      <div className="relative bg-white shadow-xl border rounded-sm overflow-hidden w-full max-w-[794px] aspect-[210/297]">
                        <iframe
                          src={`${activityPlan.pdf_url}#page=1&view=FitH&toolbar=0&navpanes=0`}
                          className="absolute inset-0 w-full h-full border-0"
                          title="Activity Plan First Page"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="relative bg-white shadow-xl border rounded-sm overflow-hidden w-full max-w-[794px] aspect-[210/297] flex items-center justify-center text-gray-500">
                        No PDF submitted for this activity plan.
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
              {/* Organization Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>{activityPlan.organization || '—'}</span>
                </div>
              </motion.div>

              {/* Submission Details Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Submitted by</span>
                    <span className="text-gray-900 font-medium">{activityPlan.student_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        activityPlan.approval_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : activityPlan.approval_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {activityPlan.approval_status === 'revision_requested'
                        ? 'Under Revision'
                        : activityPlan.approval_status}
                    </span>
                  </div>
                  {activityPlan.submitted_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Submitted on</span>
                      <span className="text-gray-900 font-medium">{new Date(activityPlan.submitted_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {activityPlan.priority && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Priority</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          activityPlan.priority?.toLowerCase() === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : activityPlan.priority?.toLowerCase() === 'normal'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {activityPlan.priority?.charAt(0).toUpperCase()}{activityPlan.priority?.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Remarks Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Remarks (optional)</h3>
                <textarea
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black placeholder:text-gray-400 outline-none"
                  placeholder="Add remarks or feedback..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                />
              </motion.div>

              {/* Actions Card */}
              {activityPlan.approval_status === 'pending' && (
                <motion.div
                  className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {submitting ? 'Processing...' : 'Approve Request'}
                    </button>

                    <button
                      onClick={handleRevision}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      {submitting ? 'Processing...' : 'Request Revision'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Actions + Remarks merged above; keep only actions below */}
            </div>
          </div>
        </div>
      </motion.div>
      {/* PDF View Modal */}
      <PDFPreviewModal
        isOpen={showPdf}
        pdfUrl={activityPlan?.pdf_url || null}
        onClose={() => setShowPdf(false)}
        onDownload={activityPlan?.pdf_url ? () => window.open(activityPlan.pdf_url, '_blank') : undefined}
        title="Activity Plan PDF"
      />
    </MainLayout>
  );
}