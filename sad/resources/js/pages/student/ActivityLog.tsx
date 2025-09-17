import RequestDetailsModal from "@/components/RequestDetailsModal"; // adjust path!
import MainLayout from "@/layouts/mainlayout";
import { FaSearch, FaFilter, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePage } from "@inertiajs/react"; // <-- Import Inertia hook

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

  // ✅ Replace dummy data with real data
  const allRequests = logs || [];
  console.log("Logs from Laravel:", logs);
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
    const colors: Record<string, string> = {
      Approved: "bg-green-100 text-green-700 border-green-300",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Cancelled: "bg-red-100 text-red-700 border-red-300",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold border ${
          colors[status] || "bg-gray-100 text-gray-700 border-gray-300"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-8 font-poppins min-h-screen text-black bg-gradient-to-br from-red-50 via-white to-red-100">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400"
              >
                <option value="">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Request Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400"
              >
                <option value="">All</option>
                <option value="Activity Plan">Activity Plan</option>
                <option value="Equipment Request">Equipment Request</option>
                <option value="Budget Request">Budget Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date & Time
              </label>
              <input
                type="text"
                placeholder="e.g. April 1, 2025"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400"
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
                  <th className="w-1/4 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Request Type
                  </th>
                  <th className="w-1/4 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Date & Time
                  </th>
                  <th className="w-1/4 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Status
                  </th>
                  <th className="w-1/4 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
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
                      <td className="w-1/4 px-8 py-4">{req.type}</td>

                      {/* Date & Time */}
                      <td className="w-1/4 px-8 py-4">
                        {new Date(req.date).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>

                      {/* Status */}
                      <td className="w-1/4 px-8 py-4">{getStatusBadge(req.status)}</td>

                      {/* Actions */}
                      <td className="w-1/4 px-8 py-4">
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
