import React, { useState } from "react";

interface Props {
  request: any;
  onClose: () => void;
  onApprove: (id: number) => void | Promise<void>;
  onRevision: (id: number, remarks: string) => void | Promise<void>;
}

export default function RequestModal({
  request,
  onClose,
  onApprove,
  onRevision,
}: Props) {
  const [remarks, setRemarks] = useState(request.remarks || "");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 text-black">
        <h2 className="text-xl font-bold mb-4">Request Details</h2>

        <p><strong>Student:</strong> {request.student_name}</p>
        <p><strong>Type:</strong> {request.request_type}</p>
        <p><strong>Status:</strong> {request.approval_status}</p>
        <p><strong>Priority:</strong> {request.priority}</p>
        <p><strong>Submitted:</strong> {new Date(request.submitted_at).toLocaleString()}</p>

        {/* Remarks Section */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            className="w-full border rounded p-2 mt-1 text-black"
            placeholder="Remarks for revision (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
          {request.approval_status === "pending" && (
            <>
              <button
                onClick={() => onApprove(request.approval_id)}
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => onRevision(request.approval_id, remarks)}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Request Revision
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
