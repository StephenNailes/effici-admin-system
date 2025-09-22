import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  request: any;
  onClose: () => void;
  onApprove: (id: number) => void | Promise<void>;
  onRevision: (id: number, remarks: string) => void | Promise<void>;
}

export default function EquipmentModal({
  request,
  onClose,
  onApprove,
  onRevision,
}: Props) {
  const [remarks, setRemarks] = useState(request.remarks || "");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.15)'}}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 text-black max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-red-600">Equipment Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

          {/* Equipment Request Details */}
          <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Student Name</p>
              <p className="text-gray-900">{request.student_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Request Type</p>
              <p className="text-gray-900 capitalize">{request.request_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Priority</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                request.priority?.toLowerCase() === 'urgent' ? 'bg-red-100 text-red-800' :
                request.priority?.toLowerCase() === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {request.priority}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                request.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.approval_status === "revision_requested" ? "Under Revision" : request.approval_status}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Submitted Date</p>
            <p className="text-gray-900">{new Date(request.submitted_at).toLocaleString()}</p>
          </div>

          {/* Equipment Items (if available) */}
          {request.request_type?.toLowerCase() === 'equipment' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Requested Equipment</p>
              <div className="bg-gray-50 rounded-lg p-3">
                {request.equipment_items && request.equipment_items.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-3 text-left font-semibold text-gray-700">Equipment Name</th>
                        <th className="py-2 px-3 text-center font-semibold text-gray-700">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.equipment_items.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 px-3 text-gray-900 font-medium">{item.equipment_name}</td>
                          <td className="py-2 px-3 text-center text-red-600 font-bold">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p>No equipment items found for this request.</p>
                    <p className="text-xs mt-1">This may be due to a data loading issue.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Remarks Section */}
          <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Remarks {request.approval_status === 'pending' && '(Optional)'}
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-black focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none"
            placeholder="Add remarks for revision or approval notes..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            disabled={request.approval_status !== 'pending'}
          />
        </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          {request.approval_status === "pending" && (
            <>
              <button
                onClick={() => onApprove(request.approval_id)}
                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                Approve Request
              </button>
              <button
                onClick={() => onRevision(request.approval_id, remarks)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Request Revision
              </button>
            </>
          )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}