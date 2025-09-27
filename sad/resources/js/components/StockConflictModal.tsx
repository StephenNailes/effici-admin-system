import React from 'react';
import { formatDateTime, formatTime12h } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Users, Calendar, Package, Edit3 } from 'lucide-react';

interface ConflictingRequest {
  request_id: number;
  quantity: number;
  status: string;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  student_name: string;
}

interface StockConflict {
  equipment_name: string;
  total_stock: number;
  requested_quantity: number;
  available_quantity: number;
  shortage: number;
  conflicting_requests: ConflictingRequest[];
}

interface StockConflictDetails {
  request_id: number;
  student_name: string;
  conflicts: StockConflict[];
  total_conflicts: number;
  suggestion: string;
}

interface StockConflictModalProps {
  open: boolean;
  onClose: () => void;
  details: StockConflictDetails | null;
  onRequestRevision: (requestId: number) => void;
}

export default function StockConflictModal({ open, onClose, details, onRequestRevision }: StockConflictModalProps) {
  if (!details) return null;

  const handleRequestRevision = () => {
    onRequestRevision(details.request_id);
    onClose();
  };

  // Deprecated local function replaced by shared utility

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800">Stock Conflict Detected</h2>
                  <p className="text-red-600 text-sm">Cannot approve due to insufficient inventory</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-red-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Request Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Current Request Details
                </h3>
                <p className="text-gray-600">
                  <strong>Student:</strong> {details.student_name} (Request #{details.request_id})
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  This request conflicts with {details.total_conflicts} equipment item{details.total_conflicts !== 1 ? 's' : ''}.
                </p>
              </div>

              {/* Conflicts */}
              <div className="space-y-6">
                {details.conflicts.map((conflict, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-red-200 rounded-xl p-5 bg-red-50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Package className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-800 text-lg">{conflict.equipment_name}</h4>
                    </div>

                    {/* Stock Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded-lg border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{conflict.total_stock}</div>
                        <div className="text-sm text-gray-600">Total Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{conflict.requested_quantity}</div>
                        <div className="text-sm text-gray-600">Requested</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{conflict.available_quantity}</div>
                        <div className="text-sm text-gray-600">Available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">-{conflict.shortage}</div>
                        <div className="text-sm text-gray-600">Shortage</div>
                      </div>
                    </div>

                    {/* Conflicting Requests */}
                    {conflict.conflicting_requests.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Conflicting Requests ({conflict.conflicting_requests.length})
                        </h5>
                        <div className="space-y-3">
                          {conflict.conflicting_requests.map((req, reqIndex) => (
                            <div
                              key={reqIndex}
                              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-medium text-gray-800">{req.student_name}</div>
                                  <div className="text-sm text-gray-600">Request #{req.request_id}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                    {req.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {req.quantity} units
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Purpose:</strong> {req.purpose}
                              </div>
                              <div className="text-xs text-gray-500">
                                <strong>Period:</strong> {formatDateTime(req.start_datetime)} → {formatDateTime(req.end_datetime)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Suggestion */}
              {details.suggestion && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Recommendation
                  </h4>
                  <p className="text-blue-700 text-sm">{details.suggestion}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Unable to approve due to insufficient stock availability.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleRequestRevision}
                  className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Request Revision
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}