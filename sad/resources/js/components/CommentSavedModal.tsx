import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

export interface CommentSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  autoCloseMs?: number; // default 2000ms
}

const CommentSavedModal: React.FC<CommentSavedModalProps> = ({
  isOpen,
  onClose,
  message = 'Comments saved successfully!',
  autoCloseMs = 2000,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const timer = window.setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose, autoCloseMs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-saved-title"
            aria-describedby="comment-saved-desc"
            className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-xl border border-green-200 bg-white shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-green-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700 ring-1 ring-green-200">
                  <CheckCircle2 size={20} />
                </div>
                <h3 id="comment-saved-title" className="text-sm font-semibold text-gray-900">
                  Success
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 py-4">
                <p id="comment-saved-desc" className="text-sm text-gray-700">
                  {message}
                </p>
              </div>

              {/* Footer (optional placeholder for future actions) */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-right">
                <span className="text-xs text-gray-500">This will close automatically</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentSavedModal;
