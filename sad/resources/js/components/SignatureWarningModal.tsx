import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignatureWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignatureWarningModal: React.FC<SignatureWarningModalProps> = ({ isOpen, onClose }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">E-Signature Already Added</h3>
            <p className="text-gray-600 mb-6">
              You cannot add another e-signature because you have already added one for the "Prepared by" section.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignatureWarningModal;
