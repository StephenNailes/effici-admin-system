import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/layouts/mainlayout";
import { Download, Maximize2, Check, X, ArrowLeft, Users, PenTool, Save, Trash2, Move, MessageSquare } from "lucide-react";
import axios from "axios";
import { router } from "@inertiajs/react";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import AddPdfCommentsModal from "@/components/AddPdfCommentsModal";
import CommentSavedModal from "@/components/CommentSavedModal";
import { toast } from 'react-toastify';
import ReactSignatureCanvas from 'react-signature-canvas';

interface Props {
  id: string;
}

interface Signature {
  id: string;
  imageData: string;
  x: number;
  y: number;
}

export default function ActivityPlanApproval({ id }: Props) {
  const [activityPlan, setActivityPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isSignatureMode, setIsSignatureMode] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [showCommentViewer, setShowCommentViewer] = useState(false);
  const [showCommentSaved, setShowCommentSaved] = useState(false);
  const panTimerRef = useRef<number | null>(null);
  const signatureCanvasRef = useRef<ReactSignatureCanvas | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const getCsrfMetaToken = () => {
    const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return el?.content || '';
  };

  // Memoize the PDF URL to prevent iframe reloads during signature dragging
  const pdfUrl = useMemo(() => {
    if (!activityPlan?.pdf_url) return null;
    
    const base = activityPlan.pdf_url.split('?')[0];
    const unsigned = base.replace(/_signed\.pdf$/i, '.pdf');
    const url = isSignatureMode ? unsigned : base;
    
    // Use a stable cache buster that only changes when activityPlan.pdf_url changes
    const cacheBuster = `t=${activityPlan.pdf_url}`;
    const existingQs = activityPlan.pdf_url.includes('?') ? activityPlan.pdf_url.split('?')[1] : '';
    const qs = existingQs ? `${existingQs}&${cacheBuster}` : cacheBuster;
    
    return `${url}?${qs}#page=2&view=Fit&toolbar=0&navpanes=0&zoom=100`;
  }, [activityPlan?.pdf_url, isSignatureMode]);

  useEffect(() => {
    axios
      .get(`/api/approvals/${id}`)
      .then((res) => {
        setActivityPlan(res.data);
        setLoading(false);
        // Load existing signatures
        return axios.get(`/api/approvals/${id}/signatures`);
      })
      .then((sigRes) => {
        if (sigRes?.data?.signatures) {
          const list: Signature[] = sigRes.data.signatures;
          // Show ALL existing signatures so dean can see where previous approvers placed theirs
          setSignatures(list);
        }
      })
      .catch((err) => {
        console.error("Error loading activity plan:", err);
        setLoading(false);
      });
  }, [id]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const csrf = getCsrfMetaToken();
      await axios.post(`/api/approvals/${id}/approve`, {}, {
        withCredentials: true,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
          'Content-Type': 'application/json'
        }
      });
  toast.success('Activity plan approved.');
  router.visit('/dean/requests');
    } catch (err) {
      console.error('Error approving activity plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSignatureMode = () => {
    const next = !isSignatureMode;
    setIsSignatureMode(next);
    if (!next) {
      // ensure pan mode is off when leaving signature mode
      if (panTimerRef.current) {
        window.clearTimeout(panTimerRef.current);
        panTimerRef.current = null;
      }
      setIsPanMode(false);
    }
  };

  const togglePanMode = () => {
    if (!isSignatureMode) return; // pan only in signature mode
    // toggle on/off, with auto-timeout when turning on
    if (!isPanMode) {
      setIsPanMode(true);
      if (panTimerRef.current) {
        window.clearTimeout(panTimerRef.current);
      }
      panTimerRef.current = window.setTimeout(() => {
        setIsPanMode(false);
        panTimerRef.current = null;
      }, 6000); // auto-exit pan after 6s
    } else {
      if (panTimerRef.current) {
        window.clearTimeout(panTimerRef.current);
        panTimerRef.current = null;
      }
      setIsPanMode(false);
    }
  };

  useEffect(() => {
    return () => {
      if (panTimerRef.current) {
        window.clearTimeout(panTimerRef.current);
        panTimerRef.current = null;
      }
    };
  }, []);

  const openSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const saveSignatureToCanvas = () => {
    if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
      const imageData = signatureCanvasRef.current.toDataURL('image/png');
      const newSignature: Signature = {
        id: `sig-${Date.now()}`,
        imageData,
        x: 100,
        y: 100,
      };
      // Allow only one signature at a time
      setSignatures([newSignature]);
      closeSignatureModal();
    }
  };

  const removeSignature = (sigId: string) => {
    setSignatures(signatures.filter(s => s.id !== sigId));
  };

  const handleMouseDownOnSignature = (e: React.MouseEvent, sigId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sig = signatures.find(s => s.id === sigId);
    if (!sig || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    setDraggingId(sigId);
    setDragOffset({
      x: e.clientX - rect.left - sig.x,
      y: e.clientY - rect.top - sig.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    // Calculate new position relative to the page container
    let newX = e.clientX - rect.left - dragOffset.x;
    let newY = e.clientY - rect.top - dragOffset.y;
    // Clamp within bounds of the page
    const pageWidth = rect.width;
    const pageHeight = rect.height;
    // Log actual dimensions for debugging coordinate issues
    if (draggingId && Math.random() < 0.1) { // Log occasionally to avoid spam
      console.log('[Dean E-Sign] Container dimensions:', {
        width: rect.width,
        height: rect.height,
        expectedHeight: 794 * (297 / 210),
        signature: { x: newX, y: newY }
      });
    }
    // Assuming signature image max width ~200px, prevent it from going out completely
    const maxSigW = 200;
    const maxSigH = 80;
    newX = Math.max(0, Math.min(newX, pageWidth - maxSigW));
    newY = Math.max(0, Math.min(newY, pageHeight - maxSigH));
    setSignatures(prev => prev.map(s => s.id === draggingId ? { ...s, x: newX, y: newY } : s));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const saveSignedDocument = async () => {
    setSaving(true);
    try {
      const csrf = getCsrfMetaToken();
      
      // Debug: Log container and signature positions before saving
      if (pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        console.log('[Dean E-Sign] Saving signatures with container info:', {
          containerDimensions: { width: rect.width, height: rect.height },
          expectedDimensions: { width: 794, height: 794 * (297 / 210) },
          signatures: signatures.map(sig => ({
            x: sig.x,
            y: sig.y,
            percentX: (sig.x / rect.width * 100).toFixed(2) + '%',
            percentY: (sig.y / rect.height * 100).toFixed(2) + '%'
          }))
        });
      }
      
      const response = await axios.post(`/api/approvals/${id}/save-signatures`, { 
        signatures: signatures.map(sig => ({
          imageData: sig.imageData,
          x: sig.x,
          y: sig.y,
        }))
      }, {
        withCredentials: true,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
          'Content-Type': 'application/json'
        }
      });
      
      setIsSignatureMode(false);
      // Exit pan mode if it was active
      if (panTimerRef.current) {
        window.clearTimeout(panTimerRef.current);
        panTimerRef.current = null;
      }
      setIsPanMode(false);
      
      // Refetch the activity plan to get the updated PDF URL pointing to the signed PDF
      try {
        const refreshResponse = await axios.get(`/api/approvals/${id}`);
        setActivityPlan(refreshResponse.data);
        alert('Signatures saved and permanently embedded into the PDF!\n\nThe preview has been refreshed. You can now approve the request.');
      } catch (refreshErr) {
        console.error('Error refreshing activity plan:', refreshErr);
        // Fallback: just add cache buster if refresh fails
        setActivityPlan((prev: any) => prev ? {
          ...prev,
          pdf_url: prev.pdf_url ? `${prev.pdf_url.split('?')[0]}?t=${Date.now()}` : prev.pdf_url
        } : prev);
        alert('Signatures saved! Please refresh the page to see the updated PDF.');
      }
    } catch (error) {
      console.error('Error saving signatures:', error);
      alert('Failed to save and embed signatures into PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevision = async () => {
    setSubmitting(true);
    try {
      const csrf = getCsrfMetaToken();
      await axios.post(`/api/approvals/${id}/revision`, {
        remarks
      }, {
        withCredentials: true,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
          'Content-Type': 'application/json'
        }
      });
  toast.info('Revision requested for this activity plan.');
  router.visit('/dean/requests');
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
              onClick={() => router.visit('/dean/requests')}
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
              <div 
                ref={pdfContainerRef}
                className="p-6 h-full overflow-y-auto relative"
                onMouseMove={isSignatureMode && !isPanMode ? handleMouseMove : undefined}
                onMouseUp={isSignatureMode && !isPanMode ? handleMouseUp : undefined}
                onMouseLeave={isSignatureMode && !isPanMode ? handleMouseUp : undefined}
              >
                <motion.div
                  className="bg-transparent p-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {activityPlan?.pdf_url ? (
                    <div className="flex justify-center relative overflow-auto">
                      {/* A4 page container: max width ~794px at 96dpi with A4 aspect ratio */}
                      <div ref={pageRef} className="relative bg-white shadow-xl border rounded-sm overflow-hidden w-[794px] min-w-[794px] max-w-[794px] aspect-[210/297]">
                        <iframe
                          key={pdfUrl}
                          src={pdfUrl || undefined}
                          className="absolute inset-0 w-full h-full border-0"
                          title="Activity Plan Last Page (Approval Signatures)"
                          style={{ pointerEvents: isSignatureMode && !isPanMode ? 'none' : 'auto' }}
                        />
                        {/* Signature overlay - render ONLY in signature edit mode (avoid double-visual) */}
                        {isSignatureMode && !isPanMode && signatures.length > 0 && signatures.map(sig => (
                          <div
                            key={sig.id}
                            style={{
                              position: 'absolute',
                              left: `${sig.x}px`,
                              top: `${sig.y}px`,
                              cursor: isSignatureMode ? 'move' : 'default',
                              zIndex: 10,
                            }}
                            onMouseDown={isSignatureMode ? (e) => handleMouseDownOnSignature(e, sig.id) : undefined}
                          >
                            <div className="relative group">
                              <img 
                                src={sig.imageData} 
                                alt="Signature" 
                                className={`max-w-[200px] pointer-events-none ring-2 ring-blue-400 ring-offset-2`}
                                draggable={false}
                                style={{
                                  backgroundColor: 'transparent'
                                }}
                              />
                              {isSignatureMode && (
                                <button
                                  onClick={() => removeSignature(sig.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
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
                          activityPlan.priority?.toLowerCase() === 'high'
                            ? 'bg-red-100 text-red-800'
                            : ['medium'].includes(activityPlan.priority?.toLowerCase() || '')
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

              {/* Removed inline remarks in favor of structured PDF comments */}

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
                    {!isSignatureMode ? (
                      <>
                        <button
                          onClick={() => setShowCommentViewer(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Add Comments
                        </button>
                        <button
                          onClick={toggleSignatureMode}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <PenTool className="w-4 h-4" />
                          E-Sign Document
                        </button>
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
                      </>
                    ) : (
                      <>
                        <button
                          onClick={openSignatureModal}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          <PenTool className="w-4 h-4" />
                          Add Signature
                        </button>
                        <button
                          onClick={togglePanMode}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${isPanMode ? 'bg-gray-700' : 'bg-gray-500'} text-white rounded-lg hover:brightness-110 transition-colors`}
                          title={isPanMode ? 'Pan mode is ON (auto-exits in a few seconds)' : 'Enable Pan mode to scroll the PDF'}
                        >
                          <Move className="w-4 h-4" />
                          {isPanMode ? 'Pan Mode (ON)' : 'Pan PDF'}
                        </button>
                        <button
                          onClick={saveSignedDocument}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Signed Document'}
                        </button>
                        <button
                          onClick={toggleSignatureMode}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    )}
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

      {/* Signature Drawing Modal */}
      <AnimatePresence>
        {showSignatureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }}
            onClick={closeSignatureModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Draw Your Signature</h3>
                <p className="text-sm text-gray-500 mt-1">Sign using your mouse or touchpad</p>
              </div>
              <div className="p-6">
                <div className="border-2 border-gray-300 rounded-lg bg-white relative overflow-hidden">
                  {/* Checkered background pattern to show transparency */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                  <ReactSignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      width: 600,
                      height: 200,
                      className: 'w-full h-[200px] cursor-crosshair relative z-10'
                    }}
                    backgroundColor="rgba(0, 0, 0, 0)"
                    penColor="#000000"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => signatureCanvasRef.current?.clear()}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 
                           border border-gray-300 hover:border-gray-400 rounded-lg 
                           hover:bg-gray-100 transition-colors duration-150"
                >
                  Clear
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={closeSignatureModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 
                             border border-gray-300 hover:border-gray-400 rounded-lg 
                             hover:bg-gray-100 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSignatureToCanvas}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                             rounded-lg transition-colors duration-150 focus:outline-none 
                             focus:ring-2 focus:ring-blue-200"
                  >
                    Add to Document
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Comment Viewer Modal - centralized component */}
      {activityPlan?.pdf_url && (
        <AddPdfCommentsModal
          isOpen={showCommentViewer}
          onClose={() => setShowCommentViewer(false)}
          pdfUrl={activityPlan.pdf_url}
          requestId={activityPlan.request_id}
          requestType="activity_plan"
          isApprover={true}
          onSaveComments={async (comments) => {
            try {
              const csrf = getCsrfMetaToken();
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
              setShowCommentSaved(true);
              setShowCommentViewer(false);
            } catch (error) {
              console.error('Error saving comments:', error);
              toast.error('Failed to save comments. Please try again.');
            }
          }}
        />
      )}
      <CommentSavedModal 
        isOpen={showCommentSaved} 
        onClose={() => setShowCommentSaved(false)} 
      />
    </MainLayout>
  );
}