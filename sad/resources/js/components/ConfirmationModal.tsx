import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  processing?: boolean;
  data: {
    officer_organization: string;
    officer_position: string;
    election_date: string;
    term_duration: string;
    reason: string;
  };
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  processing = false,
  data,
}: ConfirmationModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatTermDuration = (term: string) => {
    const map: Record<string, string> = {
      '1_semester': '1 Semester',
      '1_year': '1 Academic Year',
      '2_years': '2 Years',
      'ongoing': 'Ongoing/Indefinite',
    };
    return map[term] || term;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal Container - Centered */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 pointer-events-auto relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Confirm Your Information
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Please verify that all the information you provided is correct before submitting.
                </p>
              </div>

              {/* Information Review - No Scrolling */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Organization/Department
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {data.officer_organization || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Officer Position
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {data.officer_position || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Election/Appointment Date
                    </p>
                    <p className="text-sm text-gray-900">
                      {data.election_date
                        ? new Date(data.election_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Term Duration
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatTermDuration(data.term_duration)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Additional Details
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-4">
                    {data.reason || '-'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel & Review
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={processing}
                  className="flex-1 bg-[#e6232a] hover:bg-[#d01e24] disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg disabled:cursor-not-allowed"
                >
                  {processing ? 'Submitting...' : 'Yes, Submit Request'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
