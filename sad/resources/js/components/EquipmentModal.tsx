import React, { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, BadgeCheck, Clock, FileText } from "lucide-react";

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
  const [remarks, setRemarks] = useState<string>(request.remarks || "");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape for accessibility
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusLabel: string =
    request.approval_status === "revision_requested"
      ? "Under Revision"
      : request.approval_status || "—";
  const statusColor: string =
    request.approval_status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : request.approval_status === "approved"
      ? "bg-green-100 text-green-800"
      : request.approval_status === "revision_requested"
      ? "bg-orange-100 text-orange-800"
      : "bg-gray-100 text-gray-700";

  const priorityLabel: string = request.priority || "—";
  const priorityLower = (request.priority || "").toLowerCase();
  const priorityColor: string =
    priorityLower === "high"
      ? "bg-red-100 text-red-700"
      : priorityLower === "medium"
      ? "bg-yellow-100 text-yellow-800"
      : priorityLower === "low"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0,0,0,0.15)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          // Close when clicking outside the dialog
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="equipment-modal-title"
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl text-black max-h-[90vh] overflow-y-auto border border-gray-100"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="equipment-modal-title"
                  className="text-lg md:text-xl font-bold text-red-600"
                >
                  Equipment Request Details
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Review requested items and take action
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColor}`}
              >
                <FileText className="w-3.5 h-3.5" /> {priorityLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}
              >
                {request.approval_status === "approved" ? (
                  <BadgeCheck className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {statusLabel}
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="ml-1 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 pt-4 space-y-6">
            {/* Meta grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-100 p-3 bg-white">
                <p className="text-xs font-medium text-gray-500">Student Name</p>
                <p className="text-gray-900 font-semibold">{request.student_name}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3 bg-white">
                <p className="text-xs font-medium text-gray-500">Request Type</p>
                <p className="text-gray-900 font-semibold capitalize">
                  {request.request_type}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3 bg-white">
                <p className="text-xs font-medium text-gray-500">Submitted Date</p>
                <p className="text-gray-900 font-semibold">
                  {formatDateTime(request.submitted_at)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3 bg-white">
                <p className="text-xs font-medium text-gray-500">Request ID</p>
                <p className="text-gray-900 font-semibold">
                  {request.request_id || "—"}
                </p>
              </div>
            </div>

            {/* Equipment Items (if available) */}
            {request.request_type?.toLowerCase() === "equipment" && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Requested Equipment
                </p>
                <div className="rounded-xl ring-1 ring-gray-100 overflow-hidden bg-white">
                  {request.equipment_items && request.equipment_items.length > 0 ? (
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/60 text-gray-700">
                          <th className="py-2.5 px-4 text-left font-semibold">
                            Equipment Name
                          </th>
                          <th className="py-2.5 px-4 text-center font-semibold">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.equipment_items.map((item: any, index: number) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                            }
                          >
                            <td className="py-2.5 px-4 text-gray-900">
                              {item.equipment_name}
                            </td>
                            <td className="py-2.5 px-4 text-center text-red-600 font-bold">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-gray-500 py-6">
                      No equipment items found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Admin Remarks{" "}
                {request.approval_status === "pending" && "(Optional)"}
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-black bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none"
                placeholder="Add remarks for revision or approval notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                disabled={request.approval_status !== "pending"}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 rounded-b-2xl flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {request.approval_status === "pending" && (
              <>
                <button
                  onClick={() => onApprove(request.approval_id)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
                >
                  Approve Request
                </button>
                <button
                  onClick={() => onRevision(request.approval_id, remarks)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
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