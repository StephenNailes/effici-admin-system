import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/mainlayout";
import { Search, Eye, FileText, Clock, CheckCircle, Edit, Check, Minus, Inbox, Loader2 } from "lucide-react";
import RequestPriorityFilterDropdown from "@/components/RequestPriorityFilterDropdown";
import EquipmentModal from "@/components/EquipmentModal";
import StockConflictModal from "@/components/StockConflictModal";
import BatchApprovalModal from "@/components/BatchApprovalModal";
import { motion } from "framer-motion";
import { router } from "@inertiajs/react";
import { toast } from "react-toastify"; // global toast
import { formatDateTime, formatTime12h, formatDateShort } from "@/lib/utils";

// Add pagination state
const PAGE_SIZE = 8;

// Local types
type RequestItem = {
  approval_id: number;
  request_id: number;
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
  const [searchTerm, setSearchTerm] = useState("");   // for actual search
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    underRevision: 0,
  });
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  // Using extracted dropdown component now
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [stockConflictModalOpen, setStockConflictModalOpen] = useState(false);
  const [stockConflictDetails, setStockConflictDetails] = useState<any>(null);
  const [selectedApprovals, setSelectedApprovals] = useState<number[]>([]);
  const [batchApprovalModalOpen, setBatchApprovalModalOpen] = useState(false);

  const fetchRequests = () => {
    setRequestsLoading(true);
    fetch(`/api/approvals?role=admin_assistant`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(res => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setStats(
          data.stats || { total: 0, pending: 0, approved: 0, underRevision: 0 }
        );
        setRequestsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching requests:", err);
        // Fallback to empty state if API fails
        setRequests([]);
        setStats({ total: 0, pending: 0, approved: 0, underRevision: 0 });
        setRequestsLoading(false);
      });
  };

  const fetchEquipment = () => {
    setEquipmentLoading(true);
    
    fetch(`/api/equipment/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(res => res.json())
      .then((data) => {
        setEquipment(data);
        setEquipmentLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching equipment:", err);
        setEquipmentLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
    fetchEquipment();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        toast.success('Request approved successfully');
        fetchRequests();
        setSelected(null);
      } else {
        // Handle errors
        console.error('Error approving request:', data);
        
        // Check if this is a stock conflict error
        if (data.error === 'insufficient_stock' && data.details) {
          setStockConflictDetails(data.details);
          setStockConflictModalOpen(true);
          toast.warning('Stock conflict detected. Review quantities.');
          return;
        }
        
        // Handle other types of errors
        toast.error('Error approving request. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Network error. Check your connection and try again.');
    }
  };

  const handleRevision = async (id: number, remarks: string) => {
    try {
      const response = await fetch(`/api/approvals/${id}/revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ remarks })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        fetchRequests();
        setSelected(null);
        toast.info('Revision request sent to student');
      } else {
        console.error('Error requesting revision:', data);
        toast.error('Error requesting revision. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Network error. Check your connection and try again.');
    }
  };

  const handleStockConflictRevision = (requestId: number) => {
    // Create a detailed revision message based on the stock conflicts
    const conflicts = stockConflictDetails?.conflicts || [];
    let revisionMessage = "Stock availability conflict detected. Please review and reduce quantities for the following equipment:\n\n";
    
    conflicts.forEach((conflict: any, index: number) => {
      revisionMessage += `${index + 1}. ${conflict.equipment_name}:\n`;
      revisionMessage += `   - Requested: ${conflict.requested_quantity} units\n`;
      revisionMessage += `   - Available: ${conflict.available_quantity} units\n`;
      revisionMessage += `   - Shortage: ${conflict.shortage} units\n\n`;
    });
    
    revisionMessage += "Please modify your request to fit within available stock limits or consider alternative equipment.";

    // Find the approval ID for this request
    const request = requests.find(r => r.request_id === requestId);
    if (request) {
      handleRevision(request.approval_id, revisionMessage);
    }
    
    setStockConflictModalOpen(false);
    setStockConflictDetails(null);
    toast.info('Revision requested with stock conflict details');
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

  // Batch selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingApprovalIds = paginatedRequests
        .filter(req => req.approval_status === 'pending')
        .map(req => req.approval_id);
      setSelectedApprovals(pendingApprovalIds);
    } else {
      setSelectedApprovals([]);
    }
  };

  const handleSelectIndividual = (approvalId: number, checked: boolean) => {
    if (checked) {
      setSelectedApprovals(prev => [...prev, approvalId]);
    } else {
      setSelectedApprovals(prev => prev.filter(id => id !== approvalId));
    }
  };

  const handleBatchApprove = () => {
    if (selectedApprovals.length === 0) {
      toast.error('Please select requests to approve');
      return;
    }
    setBatchApprovalModalOpen(true);
  };

  const confirmBatchApproval = async () => {
    try {
      const response = await fetch('/api/approvals/batch-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          approval_ids: selectedApprovals
        })
      });

      if (!response.ok) {
        throw new Error('Failed to batch approve');
      }

      const data = await response.json();
      
      if (data.successful_count > 0) {
        toast.success(`Successfully approved ${data.successful_count} requests`);
        fetchRequests(); // Refresh the list
        setSelectedApprovals([]); // Clear selection
      }
      
      if (data.failed_count > 0) {
        toast.warning(`${data.failed_count} requests failed to approve`);
      }
      
      setBatchApprovalModalOpen(false);
    } catch (error) {
      console.error('Batch approval error:', error);
      toast.error('Failed to approve requests');
      setBatchApprovalModalOpen(false);
    }
  };

  // Enhanced filtering logic for search - show equipment & activity plan requests but HIDE approved ones (reverted per request)
  const filteredRequests = requests
    .filter((r) => {
      const requestType = r.request_type?.toLowerCase();
      if (!(requestType === "equipment" || requestType === "activity" || requestType === "activity_plan")) return false;
      // Exclude anything already approved so the table focuses on actionable items
      if (r.approval_status?.toLowerCase() === 'approved') return false;
      return true;
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
  const dateString = formatDateShort(dateObj).toLowerCase();
  const timeString = formatTime12h(dateObj).toLowerCase();
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

  // Adjust current page if filtering reduces total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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
          <div className="relative flex-1">
            <motion.input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-black bg-gray-50 transition-all duration-200"
              initial={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
              whileFocus={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          <RequestPriorityFilterDropdown
            priority={filters.priority}
            onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
          />
        </motion.div>

  {/* Priority filter dropdown component extracted */}

        {/* Batch Actions */}
        {selectedApprovals.length > 0 && (
          <motion.div
            className="mb-4 flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span className="text-red-700 font-medium">
              {selectedApprovals.length} request{selectedApprovals.length > 1 ? 's' : ''} selected
            </span>
            <motion.button
              onClick={handleBatchApprove}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Batch Approve ({selectedApprovals.length})
            </motion.button>
          </motion.div>
        )}

        {/* request Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col" style={{ minHeight: 590 }}>
          <div className="flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10">
              <tr className="text-left">
                <th className="px-6 py-3 text-[11px] font-semibold tracking-wider text-gray-600 uppercase w-16">
                  <input
                    type="checkbox"
                    checked={selectedApprovals.length > 0 && selectedApprovals.length === paginatedRequests.filter(req => req.approval_status === 'pending').length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                {['Submitted by','Request Type','Date & Time','Priority','Status','Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-[11px] font-semibold tracking-wider text-black uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {requestsLoading && (
                [...Array(PAGE_SIZE)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="h-4 w-4 bg-gray-200 rounded" />
                    </td>
                    {Array.from({length:6}).map((__, c) => (
                      <td key={c} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!requestsLoading && paginatedRequests.length > 0 && (
                paginatedRequests.map((req) => (
                  <tr key={req.approval_id} className="hover:bg-red-50/60 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.includes(req.approval_id)}
                        onChange={(e) => handleSelectIndividual(req.approval_id, e.target.checked)}
                        disabled={req.approval_status !== 'pending'}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {req.student_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                      {req.request_type?.replace('_',' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatDateTime(req.submitted_at)}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${getPriorityColor(req.priority ?? "")}`}>
                      {req.priority || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(req.approval_status)}`}>
                        {req.approval_status === "revision_requested" ? "Under Revision" : req.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        onClick={() => {
                          if (req.request_type?.toLowerCase() === "activity" || req.request_type?.toLowerCase() === "activity_plan") {
                            router.visit(`/admin/activity-plan-approval/${req.approval_id}`);
                          } else {
                            setSelected(req);
                          }
                        }}
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!requestsLoading && paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <div className="flex flex-col items-center justify-center text-center gap-3 text-gray-500" style={{height: '420px'}}>
                      <Inbox className="w-12 h-12 text-gray-300" />
                      <p className="text-sm font-medium">No requests match the current filters.</p>
                      <button
                        onClick={() => { setFilters({ status: "", priority: "" }); setSearchTerm(""); }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Clear filters & search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          {/* Bottom Pagination Bar */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-6 py-3 border-t border-gray-100 bg-white">
            <div className="text-[11px] text-gray-500 order-2 sm:order-1 tracking-wide">
              {filteredRequests.length > 0 && !requestsLoading && (
                <>Showing <span className="font-medium text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-medium text-gray-700">{Math.min(currentPage * PAGE_SIZE, filteredRequests.length)}</span> of <span className="font-medium text-gray-700">{filteredRequests.length}</span></>
              )}
              {filteredRequests.length === 0 && !requestsLoading && 'No results'}
              {requestsLoading && 'Loading...'}
            </div>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <button
                className="h-8 px-3 rounded-md text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <div className="h-8 px-3 flex items-center rounded-md text-xs font-semibold text-gray-700 bg-gray-50">
                {totalPages === 0 ? 1 : currentPage} / {totalPages || 1}
              </div>
              <button
                className="h-8 px-3 rounded-md text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
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

        {/* Stock Conflict Modal */}
        <StockConflictModal
          open={stockConflictModalOpen}
          onClose={() => {
            setStockConflictModalOpen(false);
            setStockConflictDetails(null);
          }}
          details={stockConflictDetails}
          onRequestRevision={handleStockConflictRevision}
        />

        {/* Batch Approval Modal */}
        <BatchApprovalModal
          isOpen={batchApprovalModalOpen}
          onClose={() => setBatchApprovalModalOpen(false)}
          onConfirm={confirmBatchApproval}
          selectedRequests={selectedApprovals.map(id => ({ approval_id: id }))}
          userRole="admin_assistant"
        />
      </div>
    </MainLayout>
  );
}
