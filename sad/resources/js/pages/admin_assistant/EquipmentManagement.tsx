import React, { useEffect, useState } from "react";
import MainLayout from "@/layouts/mainlayout";
import axios from "axios";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  checked_out: "bg-blue-100 text-blue-700",
  returned: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  completed: "bg-gray-200 text-gray-700",
  cancelled: "bg-red-900 text-white",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  checked_out: "Checked Out",
  returned: "Returned",
  overdue: "Overdue",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getValidActions(status: string) {
  switch (status) {
    case "approved":
      return ["check_out", "cancel"];
    case "checked_out":
      return ["return", "mark_overdue"];
    case "overdue":
      return ["return"];
    case "returned":
      return ["complete"];
    default:
      return [];
  }
}

export default function EquipmentManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10; // ✅ pagination size = 10

  useEffect(() => {
    axios
      .get("/api/equipment-requests/manage")
      .then((res) => {
        // Filter out completed and cancelled requests
        const activeRequests = res.data.filter((req: any) => 
          req.status !== "completed" && req.status !== "cancelled"
        );
        setRequests(activeRequests);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load equipment requests.");
        setLoading(false);
      });
  }, []);

  const handleAction = async (id: number, action: string) => {
    setLoading(true);
    let newStatus = "";
    switch (action) {
      case "check_out":
        newStatus = "checked_out";
        break;
      case "return":
        newStatus = "returned";
        break;
      case "mark_overdue":
        newStatus = "overdue";
        break;
      case "complete":
        newStatus = "completed";
        break;
      case "cancel":
        newStatus = "cancelled";
        break;
      default:
        return;
    }
    try {
      await axios.patch(`/api/equipment-requests/${id}/status`, {
        status: newStatus,
      });
      
      // If the status is completed or cancelled, remove from the list
      if (newStatus === "completed" || newStatus === "cancelled") {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        // Otherwise, update the status
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      setError("Failed to update status.");
    }
    setLoading(false);
  };

  // ✅ Pagination slice
  const startIndex = (page - 1) * pageSize;
  const paginatedData = requests.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(requests.length / pageSize);

  return (
    <MainLayout>
      <div className="p-6 font-poppins space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-red-600">
            Equipment Management
          </h1>
          <p className="text-gray-500">
            Manage lifecycle of equipment requests after approval.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-black text-sm uppercase">
              <tr>
                <th className="py-3 px-6">Request ID</th>
                <th className="py-3 px-6">Student Name</th>
                <th className="py-3 px-6">Purpose</th>
                <th className="py-3 px-6">Requested Items</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="text-black text-sm divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-6 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-6 text-center text-red-400"
                    >
                      {error}
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-6 text-center text-gray-400"
                    >
                      No equipment requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-red-50 transition"
                    >
                      <td className="py-3 px-6 font-semibold">
                        {req.id}
                      </td>
                      <td className="py-3 px-6">{req.student_name}</td>
                      <td className="py-3 px-6">{req.purpose}</td>
                      <td className="py-3 px-6">
                        {req.items?.map((item: any) => (
                          <div key={item.id} className="mb-1">
                            <span className="font-medium">
                              {item.equipment_name}
                            </span>{" "}
                            <span className="text-sm text-gray-500">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {STATUS_LABELS[req.status] || req.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 space-x-1">
                        {getValidActions(req.status).map((action) => (
                          <button
                            key={action}
                            className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold shadow hover:bg-red-700 transition"
                            onClick={() => handleAction(req.id, action)}
                            disabled={loading}
                          >
                            {action === "check_out" && "Check Out"}
                            {action === "return" && "Return"}
                            {action === "mark_overdue" && "Mark Overdue"}
                            {action === "complete" && "Complete"}
                            {action === "cancel" && "Cancel"}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end items-center px-6 py-3 bg-white border-t border-gray-200 rounded-b-lg" style={{ marginTop: "-1px" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 mr-2 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 ml-2 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
