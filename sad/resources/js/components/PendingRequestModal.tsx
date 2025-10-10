import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Clock } from 'lucide-react';

interface PendingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  submittedAtIso?: string | null;
}

export default function PendingRequestModal({ isOpen, onClose, submittedAtIso }: PendingRequestModalProps) {
  if (!isOpen) return null;

  let submittedDisplay: string | null = null;
  if (submittedAtIso) {
    try {
      const d = new Date(submittedAtIso);
      submittedDisplay = d.toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch {}
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-request-title"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-black border border-red-100 relative overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 id="pending-request-title" className="text-lg font-bold text-red-600">
                  Request In Review
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">We're processing your submission</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-gray-800 font-medium">
                  Your role update request is being reviewed.
                </p>
                {submittedDisplay && (
                  <p className="text-xs text-gray-600">Submitted: {submittedDisplay}</p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">
                  An Admin Assistant is verifying your details. This usually takes less than 24 hours.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong className="text-gray-900">Next Steps</strong>
                <br />
                We'll send you both an email and an in-app notification as soon as a decision is made. If it takes longer than 24 hours and you need urgent confirmation, you may visit the <strong>Dean's Office</strong> for assistance.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold shadow-sm"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
