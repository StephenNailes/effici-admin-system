import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, X } from 'lucide-react';

interface PdfRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratePdf: () => void;
}

const PdfRequiredModal: React.FC<PdfRequiredModalProps> = ({
  isOpen,
  onClose,
  onGeneratePdf,
}) => {
  // Close on Escape for better accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-required-title"
            aria-describedby="pdf-required-desc"
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              {/* Header (no gradients) */}
              <div className="relative px-6 py-5 border-b border-gray-200 bg-white">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 ring-1 ring-red-200 flex items-center justify-center">
                      <AlertCircle size={22} />
                    </div>
                  </div>
                  <div>
                    <h2 id="pdf-required-title" className="text-lg font-semibold text-gray-900">
                      PDF Required
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Generate a PDF first to submit for approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex-shrink-0 mt-0.5">
                    <FileText size={20} className="text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p id="pdf-required-desc" className="text-gray-700 leading-relaxed">
                      You must generate a PDF version of your document before submitting it for approval.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Why is this needed?
                      </p>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        The PDF ensures your document is properly formatted and ready for review by approvers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onGeneratePdf();
                    onClose();
                  }}
                  className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <FileText size={16} />
                  Generate PDF Now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PdfRequiredModal;
