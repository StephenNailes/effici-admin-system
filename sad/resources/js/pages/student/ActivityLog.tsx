import RequestDetailsModal from "@/components/RequestDetailsModal"; // adjust path!
import MainLayout from "@/layouts/mainlayout";
import { FaSearch, FaFilter, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePage } from "@inertiajs/react"; // <-- Import Inertia hook
import FilterSelect, { FilterOption } from "@/components/FilterSelect";

export default function ActivityLog() {
  // 🔗 Get logs passed from Laravel controller
  const { logs } = usePage().props as unknown as { logs: any[] };
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 8;

  const allRequests = logs || [];
  // console.log("Logs from Laravel:", logs); // removed noisy debug log
  // 🔍 Filtering
  const filteredRequests = allRequests.filter((req) => {
    const matchesSearch =
      req.type.toLowerCase().includes(search.toLowerCase()) ||
      req.date.toLowerCase().includes(search.toLowerCase()) ||
      req.status.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus ? req.status === filterStatus : true;
    const matchesType = filterType ? req.type === filterType : true;
    const matchesDate = filterDate
      ? req.date.toLowerCase().includes(filterDate.toLowerCase())
      : true;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / logsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const getStatusBadge = (status: string) => {
    const raw = (status || '').toString();
    const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
    // Human-friendly label: snake_case -> Title Case
    const label = raw
      .trim()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Unified color map covering common statuses in the system
    const colorMap: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      revision_requested: 'bg-rose-100 text-rose-700 border-rose-300',
      under_revision: 'bg-rose-100 text-rose-700 border-rose-300',
      denied: 'bg-red-100 text-red-700 border-red-300',
      cancelled: 'bg-gray-200 text-gray-700 border-gray-300',
      canceled: 'bg-gray-200 text-gray-700 border-gray-300', // alt spelling
      overdue: 'bg-red-100 text-red-700 border-red-300',
      returned: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      checked_out: 'bg-blue-100 text-blue-700 border-blue-300', // improved design
      checkedout: 'bg-blue-100 text-blue-700 border-blue-300',
    };

    const classes = colorMap[key] || 'bg-gray-100 text-gray-700 border-gray-300';

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${classes}`}
      >
        <span className={`h-2 w-2 rounded-full ${
          key === 'approved' ? 'bg-green-500' :
          key === 'pending' ? 'bg-yellow-500' :
          key === 'completed' ? 'bg-emerald-500' :
          key === 'revision_requested' || key === 'under_revision' ? 'bg-rose-500' :
          key === 'checked_out' || key === 'checkedout' ? 'bg-blue-500' :
          key === 'returned' ? 'bg-indigo-500' :
          key === 'overdue' || key === 'denied' ? 'bg-red-500' :
          key === 'cancelled' || key === 'canceled' ? 'bg-gray-500' :
          'bg-gray-400'
        }`} />
        {label}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-8 font-poppins min-h-screen text-black bg-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-1"
        >
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">
            Activity Log
          </h1>
          <p className="text-gray-600 text-base">
            View and manage your submitted requests and activities.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 mb-8"
        >
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search request..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-black bg-white shadow-sm"
            />
            <FaSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl px-5 py-3 text-red-600 font-semibold shadow-sm transition"
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <FaFilter /> Filter
          </motion.button>
        </motion.div>

        {/* Filter Panel */}
        
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col sm:flex-row gap-4"
          >
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "Approved", label: "Approved", colorClass: "bg-green-100 text-green-700" },
                { value: "Pending", label: "Pending", colorClass: "bg-yellow-100 text-yellow-700" },
              ]}
            />
            <FilterSelect
              label="Request Type"
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: "Activity Plan", label: "Activity Plan", colorClass: "bg-red-100 text-red-700" },
                { value: "Equipment Request", label: "Equipment Request", colorClass: "bg-blue-100 text-blue-700" },
                { value: "Budget Request", label: "Budget Request", colorClass: "bg-emerald-100 text-emerald-700" },
              ]}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date & Time
              </label>
              <input
                type="text"
                placeholder="e.g. April 1, 2025"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-300"
              />
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="overflow-x-auto rounded-2xl shadow-xl bg-white border border-gray-200"
          style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", height: "700px" }}
        >
          <div className="overflow-y-auto" style={{ height: "600px" }}>
            <table className="w-full table-fixed border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-1/5 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Request Type
                  </th>
                  <th className="w-1/5 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Date & Time
                  </th>
                  <th className="w-1/5 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Status
                  </th>
                  <th className="w-1/5 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Approved By
                  </th>
                  <th className="w-1/5 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-8 text-center text-gray-400"
                    >
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * idx }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-black"
                    >
                      {/* Request Type */}
                      <td className="w-1/5 px-8 py-4">{req.type}</td>

                      {/* Date & Time */}
                      <td className="w-1/5 px-8 py-4">
                        {formatDateTime(req.date)}
                      </td>

                      {/* Status */}
                      <td className="w-1/5 px-8 py-4">{getStatusBadge(req.status)}</td>

                      {/* Approved By */}
                      <td className="w-1/5 px-8 py-4">
                        {req.approver_role && req.approval_status === 'approved' ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {req.approver_name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {req.approver_role}
                            </span>
                          </div>
                        ) : req.approval_status === 'revision_requested' ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-orange-600">
                              Revision by
                            </span>
                            <span className="text-xs text-gray-500">
                              {req.approver_role || 'Unknown Role'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="w-1/5 px-8 py-4">
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm shadow transition"
                          onClick={() => setSelectedRequest(req)} // ✅ Pass full request to modal
                        >
                          <FaEye /> View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-2 p-6 text-black border-t border-gray-200 bg-white rounded-b-2xl">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-100 transition flex items-center justify-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              aria-label="Previous Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i + 1}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold shadow ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-100 transition flex items-center justify-center"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              aria-label="Next Page"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Request Details Modal */}
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
