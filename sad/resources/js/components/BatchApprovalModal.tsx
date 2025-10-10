import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedRequests: any[];
  userRole: 'admin_assistant' | 'dean';
  isLoading?: boolean;
}

export default function BatchApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  selectedRequests,
  userRole,
  isLoading = false
}: BatchApprovalModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  const roleDisplay = userRole === 'admin_assistant' ? 'Admin Assistant' : 'Dean';
  
  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  const resetAndClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={resetAndClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Batch Approval Confirmation
                  </h3>
                </div>
                <button
                  onClick={resetAndClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  You are about to approve <span className="font-semibold text-red-600">{selectedRequests.length}</span> request{selectedRequests.length !== 1 ? 's' : ''} as <span className="font-semibold text-red-600">{roleDisplay}</span>.
                </p>

                {/* Selected requests preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Requests:</p>
                  <ul className="space-y-1">
                    {selectedRequests.map((request, index) => (
                      <li key={request.id || index} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">
                          {request.activity_category || request.title || `Request #${request.id}`}
                          <span className="text-gray-400 ml-1">
                            ({request.request_type || request.type})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This action cannot be undone. All selected requests will be marked as approved.
                  </p>
                </div>
              </div>

              {/* Confirmation checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700">
                    I understand and want to proceed with batch approval
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={resetAndClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!confirmed || isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    confirmed && !isLoading
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Approving...
                    </div>
                  ) : (
                    'Approve All'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}