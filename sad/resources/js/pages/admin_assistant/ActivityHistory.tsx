import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/layouts/mainlayout";
import { Eye, Check, Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-theme.css"; // keep if you have overrides

export default function ActivityHistory() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fetch admin assistant activities on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/approvals?role=admin_assistant")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activities");
        return res.json();
      })
      .then((data) => {
        // Map API response to table format
        const mapped = (data.requests || []).map((item: any) => {
          let status = "-";
          if (item.request_type === "equipment") {
            // Prioritize equipment_status, fallback to approval_status
            const possibleStatuses = [
              item.equipment_status,
              item.final_status,
              item.status,
              item.approval_status
            ];
            status = possibleStatuses.find(s => s && typeof s === "string" && s.trim() !== "") || "-";
            // Normalize status to match frontend display
            const statusMap: Record<string, string> = {
              completed: "completed",
              cancelled: "cancelled",
              returned: "returned",
              checked_out: "checked out",
              checkedout: "checked out",
              overdue: "overdue",
              pending: "pending",
              approved: "approved"
            };
            const normalized = status.replace(/_/g, " ").toLowerCase();
            status = statusMap[normalized] || status;
          } else {
            // For activity plans, prioritize activity_status, fallback to approval_status
            const possibleStatuses = [
              item.activity_status,
              item.status,
              item.approval_status
            ];
            status = possibleStatuses.find(s => s && typeof s === "string" && s.trim() !== "") || "-";
            // Normalize status
            const statusMap: Record<string, string> = {
              completed: "completed",
              cancelled: "cancelled",
              returned: "returned",
              checked_out: "checked out",
              checkedout: "checked out",
              overdue: "overdue",
              pending: "pending",
              approved: "approved",
              "under revision": "under revision"
            };
            const normalized = status.replace(/_/g, " ").toLowerCase();
            status = statusMap[normalized] || status;
          }
          return {
            id: item.approval_id || item.id,
            student: item.student_name || "-",
            type: item.request_type === "activity_plan" ? "Activity Plan" : "Equipment",
            dateSubmitted: item.submitted_at ? item.submitted_at.slice(0, 10) : "-",
            purpose:
              item.request_type === "activity_plan"
                ? item.activity_purpose || "-"
                : item.equipment_purpose || "-",
            status,
          };
        });
        setActivities(mapped);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // ✅ Styled DatePicker (same as ActivityPlan.tsx)
  const DatePickerNoIcon = ({
    selected,
    onChange,
    placeholder,
    required,
  }: {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholder: string;
    required?: boolean;
  }) => (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="yyyy-MM-dd HH:mm"
      placeholderText={placeholder}
      className="w-full p-3 border border-gray-300 rounded-lg 
                 focus:border-gray-500 focus:ring-0 outline-none 
                 transition-all duration-150 hover:border-gray-400 bg-gray-100 text-black"
      required={required}
    />
  );

  // Filter logic
  const filteredActivities = activities.filter((activity) => {
    const matchesType = typeFilter === "All Types" || activity.type === typeFilter;
    const matchesStatus =
      statusFilter === "All Status" ||
      activity.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      (activity.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(activity.id).toLowerCase().includes(searchTerm.toLowerCase()));
    let matchesDate = true;
    if (dateFilter instanceof Date) {
      const selectedDate = dateFilter.toISOString().slice(0, 10);
      matchesDate = activity.dateSubmitted === selectedDate;
    }
    return matchesType && matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <MainLayout>
      <div className="p-6 font-poppins space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-red-600">Activity History</h1>
          <p className="text-gray-500">Track and manage all processed activities.</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col sm:flex-row gap-4 border border-gray-100">
          {/* Type Filter */}
          <div className="relative min-w-[140px]">
            <select
              className="appearance-none px-4 h-[44px] rounded-lg border border-gray-300 text-black 
                         focus:ring-2 focus:ring-red-200 focus:outline-none transition-all pr-10 bg-gray-50 font-medium"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option>All Types</option>
              <option>Activity Plan</option>
              <option>Equipment</option>
            </select>
          </div>

          {/* Date Filter - ✅ Fixed design */}
          <div className="min-w-[220px]">
            <DatePickerNoIcon
              selected={dateFilter}
              onChange={(date) => setDateFilter(date)}
              placeholder="Select date & time"
            />
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[320px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or ID..."
              className="appearance-none pl-11 pr-4 h-[44px] rounded-lg border border-gray-300 text-black 
                         focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all bg-gray-50 font-medium w-full"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[140px]">
            <select
              className="appearance-none px-4 h-[44px] rounded-lg border border-gray-300 text-black 
                         focus:ring-2 focus:ring-red-200 focus:outline-none transition-all pr-10 bg-gray-50 font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Completed</option>
              <option>Under Revision</option>
              <option>Cancelled</option>
              <option>Checked Out</option>
              <option>Returned</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          {loading ? (
            <div className="py-8 px-6 text-center text-gray-400">Loading activities...</div>
          ) : error ? (
            <div className="py-8 px-6 text-center text-red-400">{error}</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-black text-sm uppercase">
                <tr>
                  <th className="py-3 px-6">Request ID</th>
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Date Submitted</th>
                  <th className="py-3 px-6">Purpose</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="text-black text-sm divide-y divide-gray-100">
                {filteredActivities.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <td colSpan={6} className="py-8 px-6 text-center text-gray-400">
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <svg
                          width="40"
                          height="40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="text-red-300 mb-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                        <span>No activities found</span>
                        <span className="text-xs text-gray-300">
                          Activities will appear here once processed.
                        </span>
                      </motion.div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-red-50 transition">
                      <td className="py-3 px-6 font-semibold">{activity.id}</td>
                      <td className="py-3 px-6">{activity.student}</td>
                      <td className="py-3 px-6">{activity.type}</td>
                      <td className="py-3 px-6">{activity.dateSubmitted}</td>
                      <td className="py-3 px-6">{activity.purpose}</td>
                      <td className="py-3 px-6">
                        {(() => {
                          const status = activity.status?.toLowerCase();
                          if (status === "completed") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                                <Check className="w-4 h-4" /> Completed
                              </span>
                            );
                          } else if (status === "pending") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                <Eye className="w-4 h-4" /> Pending
                              </span>
                            );
                          } else if (status === "approved") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                                Approved
                              </span>
                            );
                          } else if (status === "under revision") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                                Under Revision
                              </span>
                            );
                          } else if (status === "cancelled") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-200 text-red-700 text-xs font-semibold">
                                Cancelled
                              </span>
                            );
                          } else if (status === "checked out") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                Checked Out
                              </span>
                            );
                          } else if (status === "returned") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold">
                                Returned
                              </span>
                            );
                          } else if (status === "overdue") {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
                                Overdue
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                                {activity.status}
                              </span>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <motion.div
            className="flex justify-end items-center px-6 py-3 bg-white border-t border-gray-200 rounded-b-lg" style={{ marginTop: "-1px" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              className="px-3 py-1 mr-2 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              disabled
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              Page 1 of 1
            </span>
            <button
              className="px-3 py-1 ml-2 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              disabled
            >
              Next
            </button>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
