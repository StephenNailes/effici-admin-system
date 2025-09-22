import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/mainlayout";
import { Search, Filter, Eye, FileText, Clock, CheckCircle, Edit } from "lucide-react";
import axios from "axios";
import EquipmentModal from "@/components/EquipmentModal";
import FilterModal from "@/components/FilterModal";
import { motion } from "framer-motion";
import { router } from "@inertiajs/react";

// Add pagination state
const PAGE_SIZE = 8;

// Local types
type RequestItem = {
  approval_id: number;
  student_name: string;
  request_type: string; // 'equipment' | 'activity' | 'activity_plan'
  title?: string;
  priority?: string; // 'urgent' | 'normal' | 'minor' | string
  approval_status: string; // 'pending' | 'approved' | 'revision_requested' | 'under_revision' | string
  submitted_at: string; // ISO date string
  equipment_items?: Array<{
    equipment_name: string;
    quantity: number;
  }>;
};

type EquipmentItem = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  total_quantity: number;
};

export default function Request() {
  const [searchInput, setSearchInput] = useState(""); // for input field
  const [searchTerm, setSearchTerm] = useState("");   // for actual search
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    underRevision: 0,
  });
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRequests = () => {
    axios
      .get(`/api/approvals?role=admin_assistant`)
      .then((res) => {
        setRequests(res.data.requests || []);
        setStats(
          res.data.stats || { total: 0, pending: 0, approved: 0, underRevision: 0 }
        );
      })
      .catch((err) => {
        console.error("Error fetching requests:", err);
        // Fallback to empty state if API fails
        setRequests([]);
        setStats({ total: 0, pending: 0, approved: 0, underRevision: 0 });
      });
  };

  const fetchEquipment = () => {
    setEquipmentLoading(true);
    axios.get(`/api/equipment/all`).then((res) => {
      setEquipment(res.data);
      setEquipmentLoading(false);
    });
  };

  useEffect(() => {
    fetchRequests();
    fetchEquipment();
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

  // Enhanced filtering logic for search - Show both equipment and activity plan requests
  const filteredRequests = requests
    .filter((r) => {
      // Show both equipment and activity plan requests
      const requestType = r.request_type?.toLowerCase();
      
      // Show pending equipment requests and all activity plan requests
      if (requestType === "equipment" && r.approval_status?.toLowerCase() === "approved") {
        return false; // Hide approved equipment requests as they're already processed
      }
      
      return requestType === "equipment" || requestType === "activity" || requestType === "activity_plan";
    })
    .filter((r) => {
      const term = searchTerm.toLowerCase();

      // Student name
      const studentMatch = r.student_name?.toLowerCase().includes(term);

      // Request type
      const typeMatch = r.request_type?.toLowerCase().includes(term);

      // Priority
      const priorityMatch = r.priority?.toLowerCase().includes(term);

      // Status (show "Under Revision" for revision_requested)
      const statusValue =
        r.approval_status === "revision_requested"
          ? "under revision"
          : r.approval_status?.toLowerCase();
      const statusMatch = statusValue?.includes(term);

      // Date & Time
      const dateObj = new Date(r.submitted_at);
      const dateString = dateObj.toLocaleDateString().toLowerCase();
      const timeString = dateObj.toLocaleTimeString().toLowerCase();
      const dateMatch = dateString.includes(term);
      const timeMatch = timeString.includes(term);

      return (
        studentMatch ||
        typeMatch ||
        priorityMatch ||
        statusMatch ||
        dateMatch ||
        timeMatch
      );
    })
    .filter((r) =>
      filters.status ? r.approval_status?.toLowerCase() === filters.status : true
    )
    .filter((r) =>
      filters.priority ? r.priority?.toLowerCase() === filters.priority : true
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-600">Request Management</h1>
          <p className="text-gray-600">
            Review and manage student equipment and activity plan requests.
          </p>
        </div>

        {/* Stats (moved above equipment table) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total Requests", value: stats.total, icon: FileText, color: "red" },
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

        {/* Equipment Table (Admin View, smaller) */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg text-red-600 mb-3">Available Equipment</h2>
          <div className="bg-white rounded-lg shadow p-2">
            {equipmentLoading ? (
              <div className="text-gray-500">Loading equipment...</div>
            ) : equipment.length === 0 ? (
              <div className="text-gray-400">No equipment available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-50 to-red-100 text-left border-b border-gray-200">
                      <th className="p-2 font-semibold text-gray-700">Equipment</th>
                      <th className="p-2 font-semibold text-gray-700">Description</th>
                      <th className="p-2 font-semibold text-gray-700">Category</th>
                      <th className="p-2 font-semibold text-gray-700 text-center">Total Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((eq) => (
                      <tr key={eq.id} className="group hover:bg-red-50 transition-colors border-b border-gray-100">
                        <td className="p-2 font-medium text-gray-900">{eq.name}</td>
                        <td className="p-2 text-gray-600">{eq.description ?? "—"}</td>
                        <td className="p-2">
                          <span className="inline-block px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                            {eq.category ?? "Uncategorized"}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold text-green-600">{eq.total_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <motion.div
          className="mb-6 flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <form
            className="relative flex-1 flex"
            onSubmit={e => {
              e.preventDefault();
              setSearchTerm(searchInput);
            }}
          >
            <motion.input
              type="text"
              placeholder="Search requests..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-black bg-gray-50 transition-all duration-200"
              initial={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
              whileFocus={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <motion.button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-r-lg font-semibold flex items-center gap-2 shadow"
            >
              <Search className="w-4 h-4" />
              Search
            </motion.button>
          </form>
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg shadow text-red-700 font-semibold transition-colors"
            onClick={() => setFilterModalOpen(true)}
            whileHover={{ scale: 1.05, boxShadow: "0 4px 16px 0 rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.97 }}
          >
            <Filter className="w-5 h-5 text-red-600" />
            <span>Filter</span>
          </motion.button>
        </motion.div>

        {/* Filter Modal */}
        <FilterModal
          open={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          filters={filters}
          setFilters={setFilters}
          onApply={() => setFilterModalOpen(false)}
          onClear={() => {
            setFilters({ status: "", priority: "" });
            setFilterModalOpen(false);
          }}
        />

        {/* request Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ minHeight: 520, maxHeight: 520 }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Submitted by
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Request Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
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
                        req.priority ?? ""
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
                        {req.approval_status === "revision_requested"
                          ? "Under Revision"
                          : req.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        onClick={() => {
                          if (req.request_type?.toLowerCase() === "activity" || req.request_type?.toLowerCase() === "activity_plan") {
                            // Navigate to activity plan approval page
                            router.visit(`/admin/activity-plan-approval/${req.approval_id}`);
                          } else {
                            // Show equipment modal
                            setSelected(req);
                          }
                        }}
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
        {/* Pagination Controls - moved outside table container */}
        <div className="flex justify-end items-center px-6 py-3 bg-white border-t border-gray-200 rounded-b-lg" style={{ marginTop: "-1px" }}>
          <button
            className="px-3 py-1 mr-2 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            className="px-3 py-1 ml-2 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>

        {/* Modal - Only for equipment requests */}
        {selected && (
          <EquipmentModal
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
