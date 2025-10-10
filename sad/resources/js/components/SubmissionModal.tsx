import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface SubmissionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SubmissionModal({ isOpen, onConfirm, onCancel }: SubmissionModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
      setIsChecked(false);
    }
  };

  const handleCancel = () => {
    setIsChecked(false);
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.6 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-lg">
                  !
                </div>
                <h2 id="submission-modal-title" className="text-xl font-semibold text-gray-900">Confirm Submission</h2>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-6 leading-relaxed">
                Are you sure you want to submit the activity plan? Please review your details before proceeding.
              </p>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 leading-tight">
                  I confirm that I have reviewed all the details and they are correct
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isChecked}
                className={`px-6 py-2.5 text-sm font-medium text-white rounded-md transition-colors ${isChecked ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Confirm & Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
