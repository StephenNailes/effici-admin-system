import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/layouts/mainlayout";
import { Eye, Check, Search, ChevronDown, Filter, X, CheckCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { csrfFetch } from "@/lib/csrf";

// Filter Modal Component
const FilterModal = ({
  isOpen,
  onClose,
  typeFilter,
  statusFilter,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  typeFilter: string;
  statusFilter: string;
  onApply: (type: string, status: string) => void;
}) => {
  const [tempTypeFilter, setTempTypeFilter] = useState(typeFilter);
  const [tempStatusFilter, setTempStatusFilter] = useState(statusFilter);

  const typeOptions = ["All Types", "Activity Plan", "Equipment", "Role Update"];
  const statusOptions = [
    "All Status", "Pending", "Approved", "Completed", 
    "Under Revision", "Checked Out", 
    "Returned", "Overdue"
  ];

  const handleApply = () => {
    onApply(tempTypeFilter, tempStatusFilter);
    onClose();
  };

  const handleReset = () => {
    setTempTypeFilter("All Types");
    setTempStatusFilter("All Status");
  };

  const FilterSection = ({ 
    title, 
    options, 
    selected, 
    onSelect 
  }: { 
    title: string; 
    options: string[]; 
    selected: string; 
    onSelect: (value: string) => void 
  }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`w-full px-4 py-3 text-left rounded-lg border transition-all duration-150
                       hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 ${
              selected === option
                ? "border-red-300 bg-red-50 text-red-700 font-semibold"
                : "border-gray-200 text-gray-700 hover:text-red-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {selected === option && (
                <CheckCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Filter className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filter Options
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <div className="space-y-6">
                  <FilterSection
                    title="Request Type"
                    options={typeOptions}
                    selected={tempTypeFilter}
                    onSelect={setTempTypeFilter}
                  />
                  <FilterSection
                    title="Status"
                    options={statusOptions}
                    selected={tempStatusFilter}
                    onSelect={setTempStatusFilter}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 
                           border border-gray-300 hover:border-gray-400 rounded-lg 
                           hover:bg-gray-100 transition-colors duration-150"
                >
                  Reset All
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 
                             border border-gray-300 hover:border-gray-400 rounded-lg 
                             hover:bg-gray-100 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                             rounded-lg transition-colors duration-150 focus:outline-none 
                             focus:ring-2 focus:ring-red-200"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function ActivityHistory() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dean activities on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    csrfFetch("/api/approvals?role=dean")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activities");
        return res.json();
      })
      .then((data) => {
        // Map API response to table format
  const mapped = (data.requests || []).map((item: any) => {
          let status = "-";
          if (item.request_type === "equipment") {
            const possibleStatuses = [
              item.equipment_status,
              item.final_status,
              item.status,
              item.approval_status
            ];
            status = possibleStatuses.find(s => s && typeof s === "string" && s.trim() !== "") || "-";
            
            if (status === "under_revision") {
              status = "Under Revision";
            } else if (status === "checked_out" || status === "checkedout") {
              status = "Checked Out";
            } else if (status !== "-") {
              status = status.replace(/_/g, " ").toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
          } else {
            const possibleStatuses = [
              item.activity_status,
              item.status,
              item.approval_status
            ];
            status = possibleStatuses.find(s => s && typeof s === "string" && s.trim() !== "") || "-";
            
            if (status === "under_revision") {
              status = "Under Revision";
            } else if (status === "checked_out" || status === "checkedout") {
              status = "Checked Out";
            } else if (status !== "-") {
              status = status.replace(/_/g, " ").toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
          }
          const categoryPurpose = item.request_type === 'activity_plan'
            ? (item.activity_category || '-')
            : item.request_type === 'role_update'
              ? (item.activity_category || '-')
              : (item.equipment_purpose || '-');
          return {
            id: item.request_id || item.approval_id || item.id,
            student: item.student_name || "-",
            type: item.request_type === "activity_plan" 
              ? "Activity Plan" 
              : item.request_type === "role_update"
                ? "Role Update"
                : "Equipment",
            dateSubmitted: item.submitted_at ? item.submitted_at.slice(0, 10) : "-",
            category: categoryPurpose,
            status,
            approverRole: item.approver_role ? item.approver_role.replace('_', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : null,
            approverName: item.approver_name || null,
            approvalStatus: item.approval_status,
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Function to handle applying filters from modal
  const handleApplyFilters = (type: string, status: string) => {
    setTypeFilter(type);
    setStatusFilter(status);
  };

  // Count active filters
  const activeFiltersCount = 
    (typeFilter !== "All Types" ? 1 : 0) + 
    (statusFilter !== "All Status" ? 1 : 0);

  // DatePicker Component
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
    
    const matchesSearch = searchTerm.trim() === "" || [
      activity.student || "",
      String(activity.id || ""),
      activity.category || "",
      activity.type || ""
    ].some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
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
        <motion.div 
          className="bg-white shadow-sm rounded-xl p-6 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Filter Button */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Type & Status
                </label>
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="relative min-w-[180px] h-[44px] px-4 pr-12 text-left bg-gray-50 border border-gray-300 
                             rounded-lg hover:border-gray-400 hover:bg-gray-100 
                             focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300
                             transition-all duration-150 font-medium text-black flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span>
                      {activeFiltersCount > 0 
                        ? `Filter${activeFiltersCount > 1 ? 's' : ''} Applied` 
                        : "Filter Options"
                      }
                    </span>
                    {activeFiltersCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold 
                                   text-white bg-red-500 rounded-full ml-2"
                      >
                        {activeFiltersCount}
                      </motion.span>
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </button>
              </div>

              {/* Date Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Date Submitted
                </label>
                <div className="min-w-[220px]">
                  <DatePickerNoIcon
                    selected={dateFilter}
                    onChange={(date) => setDateFilter(date)}
                    placeholder="Select date & time"
                  />
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Search
                </label>
                <div className="relative min-w-[280px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student, ID, category, or type..."
                    className="w-full pl-11 pr-4 h-[44px] rounded-lg border border-gray-300 text-black 
                               hover:border-gray-400 hover:bg-gray-100
                               focus:ring-2 focus:ring-red-200 focus:border-red-300 focus:outline-none 
                               transition-all duration-150 bg-gray-50 font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(typeFilter !== "All Types" || statusFilter !== "All Status" || dateFilter || searchTerm) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setTypeFilter("All Types");
                  setStatusFilter("All Status");
                  setDateFilter(null);
                  setSearchTerm("");
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 
                           border border-red-200 hover:border-red-300 rounded-lg 
                           hover:bg-red-50 transition-colors duration-150 min-w-fit"
              >
                Clear All
              </motion.button>
            )}
          </div>
        </motion.div>

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
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Approved By</th>
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
                      <td className="py-3 px-6">
                        {(() => {
                          const status = activity.status?.toLowerCase();
                          if (status === "completed") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                <Check className="w-3 h-3" /> Completed
                              </span>
                            );
                          } else if (status === "pending") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                <Eye className="w-3 h-3" /> Pending
                              </span>
                            );
                          } else if (status === "approved") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                <Check className="w-3 h-3" /> Approved
                              </span>
                            );
                          } else if (status === "under revision") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                Under Revision
                              </span>
                            );
                          } else if (status === "checked out") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                Checked Out
                              </span>
                            );
                          } else if (status === "returned") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                                Returned
                              </span>
                            );
                          } else if (status === "overdue") {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                Overdue
                              </span>
                            );
                          } else {
                            const displayStatus = activity.status === "under_revision" ? "Under Revision" : activity.status;
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                                {displayStatus}
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="py-3 px-6">
                        {activity.approverName && activity.approverRole ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {activity.approverName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {activity.approverRole}
                            </span>
                          </div>
                        ) : activity.approvalStatus === 'revision_requested' && activity.approverRole ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-orange-600">
                              Revision by
                            </span>
                            <span className="text-xs text-gray-500">
                              {activity.approverRole}
                            </span>
                          </div>
                        ) : activity.approvalStatus === 'pending' ? (
                          <span className="text-sm text-gray-400">Pending</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <motion.div
            className="flex justify-end items-center px-6 py-3 bg-white border-t border-gray-200 rounded-b-lg" 
            style={{ marginTop: "-1px" }}
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

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onApply={handleApplyFilters}
      />
    </MainLayout>
  );
}
