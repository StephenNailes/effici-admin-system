import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/mainlayout";
import {
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  Edit,
} from "lucide-react";
import axios from "axios";
import RequestModal from "@/components/RequestModal";

export default function Request() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    underRevision: 0,
  });
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchRequests = () => {
    axios.get(`/api/approvals?role=admin_assistant`).then((res) => {
      setRequests(res.data.requests);
      setStats(res.data.stats);
    });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    await axios.post(`/api/approvals/${id}/approve`);
    fetchRequests();
    setSelected(null);
  };

  const handleRevision = async (id: number, remarks: string) => {
    await axios.post(`/api/approvals/${id}/revision`, { remarks });
    fetchRequests();
    setSelected(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "revision_requested":
      case "under_revision":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "text-red-600";
      case "normal":
        return "text-yellow-600";
      case "minor":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Request Management</h1>
          <p className="text-gray-600">
            Review and manage student equipment/activity requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Requests", value: stats.total, icon: FileText, color: "red" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "yellow" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "green" },
            { label: "Under Revision", value: stats.underRevision, icon: Edit, color: "red" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-black">{card.value}</p>
                </div>
                <div
                  className={`w-12 h-12 bg-${card.color}-100 rounded-full flex items-center justify-center`}
                >
                  <card.icon className={`w-6 h-6 text-${card.color}-500`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted by
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Request Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests
                    .filter((r) =>
                      r.student_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((req) => (
                      <tr key={req.approval_id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {req.student_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {req.request_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(req.submitted_at).toLocaleString()}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-medium ${getPriorityColor(
                            req.priority
                          )}`}
                        >
                          {req.priority}
                        </td>
                        <td>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              req.approval_status
                            )}`}
                          >
                            {req.approval_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <button
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            onClick={() => setSelected(req)}
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {selected && (
          <RequestModal
            request={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onRevision={handleRevision}
          />
        )}
      </div>
    </MainLayout>
  );
}
