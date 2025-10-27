import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/layouts/mainlayout";
import { Download, Maximize2, Check, X, ArrowLeft, Users, PenTool, Save, Trash2, Move, DollarSign, MessageSquare } from "lucide-react";
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

export default function BudgetRequestApproval({ id }: Props) {
  const [budgetRequest, setBudgetRequest] = useState<any>(null);
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
    if (!budgetRequest?.pdf_url) return null;
    
    const base = budgetRequest.pdf_url.split('?')[0];
    const unsigned = base.replace(/_signed\.pdf$/i, '.pdf');
    const url = isSignatureMode ? unsigned : base;
    
    // Use a stable cache buster that only changes when budgetRequest.pdf_url changes
    const cacheBuster = `t=${budgetRequest.pdf_url}`;
    const existingQs = budgetRequest.pdf_url.includes('?') ? budgetRequest.pdf_url.split('?')[1] : '';
    const qs = existingQs ? `${existingQs}&${cacheBuster}` : cacheBuster;
    
    return `${url}?${qs}#page=2&view=Fit&toolbar=0&navpanes=0&zoom=100`;
  }, [budgetRequest?.pdf_url, isSignatureMode]);

  useEffect(() => {
    axios
      .get(`/api/approvals/${id}`)
      .then((res) => {
        setBudgetRequest(res.data);
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
        console.error("Error loading budget request:", err);
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
      toast.success('Budget request approved.');
      router.visit('/dean/requests');
    } catch (err) {
      console.error('Error approving budget request:', err);
      toast.error('Failed to approve budget request.');
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
        id: `sig-new-${Date.now()}`, // Mark as new with 'sig-new-' prefix
        imageData,
        x: 100,
        y: 100,
      };
      // Remove any previous NEW signatures (starting with 'sig-new-'), but keep existing ones from backend
      const existingSignatures = signatures.filter(s => !s.id.startsWith('sig-new-'));
      setSignatures([...existingSignatures, newSignature]);
      closeSignatureModal();
    }
  };

  const removeSignature = (sigId: string) => {
    // Only allow removing NEW signatures (not existing ones from other approvers)
    if (sigId.startsWith('sig-new-')) {
      setSignatures(signatures.filter(s => s.id !== sigId));
    }
  };

  const handleMouseDownOnSignature = (e: React.MouseEvent, sigId: string) => {
    // Only allow dragging NEW signatures (not existing ones from other approvers)
    if (!sigId.startsWith('sig-new-')) return;
    
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
      
      // Only send NEW signatures to backend (those with 'sig-new-' prefix)
      const newSignaturesToSave = signatures.filter(s => s.id.startsWith('sig-new-'));
      
      if (newSignaturesToSave.length === 0) {
        toast.error('No new signature to save. Please draw a signature first.');
        return;
      }
      
      if (pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        console.log('[Dean E-Sign] Saving NEW signatures with container info:', {
          containerDimensions: { width: rect.width, height: rect.height },
          signatures: newSignaturesToSave.map(sig => ({
            x: sig.x,
            y: sig.y,
            percentX: (sig.x / rect.width * 100).toFixed(2) + '%',
            percentY: (sig.y / rect.height * 100).toFixed(2) + '%'
          }))
        });
      }
      
      const response = await axios.post(`/api/approvals/${id}/save-signatures`, { 
        signatures: newSignaturesToSave.map(sig => ({
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
      if (panTimerRef.current) {
        window.clearTimeout(panTimerRef.current);
        panTimerRef.current = null;
      }
      setIsPanMode(false);
      
      // Refetch the budget request to get the updated PDF URL
      try {
        const refreshResponse = await axios.get(`/api/approvals/${id}`);
        setBudgetRequest(refreshResponse.data);
        toast.success('Signatures saved and embedded into the PDF!');
      } catch (refreshErr) {
        console.error('Error refreshing budget request:', refreshErr);
        setBudgetRequest((prev: any) => prev ? {
          ...prev,
          pdf_url: prev.pdf_url ? `${prev.pdf_url.split('?')[0]}?t=${Date.now()}` : prev.pdf_url
        } : prev);
        toast.success('Signatures saved! Please refresh to see the updated PDF.');
      }
    } catch (error) {
      console.error('Error saving signatures:', error);
      toast.error('Failed to save signatures. Please try again.');
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
      toast.info('Revision requested for this budget request.');
      router.visit('/dean/requests');
    } catch (err) {
      console.error('Error requesting revision:', err);
      toast.error('Failed to request revision.');
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

  if (!budgetRequest) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Budget request not found.</div>
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
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Budget Request Approval (Dean)</h1>
              <p className="text-xs text-gray-500">Review the budget request document, add your signature, then approve or request revisions.</p>
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
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-600" />
                    Budget Request Document
                  </h2>
                  <div className="flex items-center gap-2">
                    {budgetRequest?.pdf_url && (
                      <a
                        href={budgetRequest.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    {budgetRequest?.pdf_url && (
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
                  {budgetRequest?.pdf_url ? (
                    <div className="flex justify-center relative overflow-auto">
                      <div ref={pageRef} className="relative bg-white shadow-xl border rounded-sm overflow-hidden w-[794px] min-w-[794px] max-w-[794px] aspect-[210/297]">
                        <iframe
                          key={pdfUrl}
                          src={pdfUrl || undefined}
                          className="absolute inset-0 w-full h-full border-0"
                          title="Budget Request Document"
                          style={{ pointerEvents: isSignatureMode && !isPanMode ? 'none' : 'auto' }}
                        />
                        {/* Signature overlay */}
                        {isSignatureMode && !isPanMode && signatures.length > 0 && signatures.map(sig => {
                          const isNewSignature = sig.id.startsWith('sig-new-');
                          return (
                          <div
                            key={sig.id}
                            style={{
                              position: 'absolute',
                              left: `${sig.x}px`,
                              top: `${sig.y}px`,
                              cursor: isSignatureMode && isNewSignature ? 'move' : 'default',
                              zIndex: 10,
                            }}
                            onMouseDown={isSignatureMode && isNewSignature ? (e) => handleMouseDownOnSignature(e, sig.id) : undefined}
                          >
                            <div className="relative group">
                              <img 
                                src={sig.imageData} 
                                alt="Signature" 
                                className={`max-w-[200px] pointer-events-none ring-2 ring-offset-2 ${
                                  isNewSignature 
                                    ? 'ring-blue-400' // New signature - draggable
                                    : 'ring-gray-300 opacity-60' // Existing signature - read-only
                                }`}
                                draggable={false}
                                style={{
                                  backgroundColor: 'transparent'
                                }}
                              />
                              {isSignatureMode && isNewSignature && (
                                <button
                                  onClick={() => removeSignature(sig.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              {!isNewSignature && (
                                <div className="absolute -top-6 left-0 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                  Previous Approver
                                </div>
                              )}
                            </div>
                          </div>
                        )})}
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
              {/* Organization Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requester</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>{budgetRequest.student_name || '—'}</span>
                </div>
              </motion.div>

              {/* Organization Name */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.03 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>{budgetRequest.organization || '—'}</span>
                </div>
              </motion.div>

              {/* Request Details Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-900 font-medium">{budgetRequest.request_category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                      budgetRequest.priority === 'high' ? 'bg-red-100 text-red-700' :
                      budgetRequest.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {budgetRequest.priority ? budgetRequest.priority.charAt(0).toUpperCase() + budgetRequest.priority.slice(1) : '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-sm text-gray-900">{budgetRequest.submitted_at ? new Date(budgetRequest.submitted_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              </motion.div>

              {/* E-Signature Section */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">E-Signature (Dean)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add your signature to the document before approval.
                </p>
                {!isSignatureMode ? (
                  <button
                    onClick={toggleSignatureMode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PenTool className="w-4 h-4" />
                    Enter Signature Mode
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={openSignatureModal}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <PenTool className="w-4 h-4" />
                        Draw Signature
                      </button>
                      <button
                        onClick={togglePanMode}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                          isPanMode 
                            ? 'bg-purple-600 text-white hover:bg-purple-700' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Move className="w-4 h-4" />
                        {isPanMode ? 'Pan Active' : 'Pan PDF'}
                      </button>
                    </div>
                    <button
                      onClick={saveSignedDocument}
                      disabled={signatures.length === 0 || saving}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        signatures.length === 0 || saving
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Signature to PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={toggleSignatureMode}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Exit Signature Mode
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCommentViewer(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Add Comments
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-5 h-5" />
                    {submitting ? 'Approving...' : 'Approve Budget Request'}
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>

                  <button
                    onClick={handleRevision}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                    {submitting ? 'Processing...' : 'Request Revision'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Signature Drawing Modal */}
      <AnimatePresence>
        {showSignatureModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeSignatureModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Draw Your Signature</h3>
                  <button
                    onClick={closeSignatureModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="border-2 border-gray-300 rounded-lg mb-4">
                  <ReactSignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      className: 'w-full h-48 cursor-crosshair',
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => signatureCanvasRef.current?.clear()}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSignatureToCanvas}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add to Document
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      {showPdf && budgetRequest?.pdf_url && (
        <PDFPreviewModal
          isOpen={showPdf}
          pdfUrl={budgetRequest.pdf_url}
          onClose={() => setShowPdf(false)}
        />
      )}

      {/* PDF Comment Viewer Modal - centralized component */}
      {budgetRequest?.pdf_url && (
        <AddPdfCommentsModal
          isOpen={showCommentViewer}
          onClose={() => setShowCommentViewer(false)}
          pdfUrl={budgetRequest.pdf_url}
          requestId={budgetRequest.request_id}
          requestType="budget_request"
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
