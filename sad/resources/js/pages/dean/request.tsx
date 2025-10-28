import React, { useState, useEffect } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { Search, Eye, FileText, Clock, CheckCircle, Edit, Check, Minus, Inbox } from 'lucide-react';
import RequestFilterDropdown from '@/components/RequestFilterDropdown';
import BatchApprovalModal from '@/components/BatchApprovalModal';
import { router } from '@inertiajs/react';
import { formatDateShort, formatTime12h } from '@/lib/utils';
import { toast } from 'react-toastify';
import { csrfFetch } from '@/lib/csrf';

interface RequestData {
  approval_id: number;
  student_name: string;
  activity_title?: string;
  activity_category?: string;
  request_type: 'activity_plan' | 'budget_request';
  submitted_at: string;
  priority: 'low' | 'medium' | 'high';
  approval_status: 'pending' | 'approved' | 'revision_requested';
}





export default function Request() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, underRevision: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Status filter removed (dean now filters only by priority)
  const [priorityFilter, setPriorityFilter] = useState(''); // '' means all
  const [requestTypeFilter, setRequestTypeFilter] = useState(''); // '' means all types
  const [selectedApprovals, setSelectedApprovals] = useState<number[]>([]);
  const [batchApprovalModalOpen, setBatchApprovalModalOpen] = useState(false);
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dean requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch dean approval requests from the API
      const response = await csrfFetch('/api/approvals?role=dean', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, underRevision: 0 });
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
      setStats({ total: 0, pending: 0, approved: 0, underRevision: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Batch selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingApprovalIds = filteredRequests
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
      const response = await csrfFetch('/api/approvals/batch-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  // Filter requests based on search term, priority, and request type
  // Dean handles activity plans AND budget requests
  const filteredRequests = requests.filter((request: RequestData) => {
    // First filter: Only show activity plans and budget requests
    if (request.request_type !== 'activity_plan' && request.request_type !== 'budget_request') {
      return false;
    }
    
    const matchesSearch = request.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.activity_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.activity_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_type?.toLowerCase().replace('_', ' ').includes(searchTerm.toLowerCase());
    const matchesPriority = !priorityFilter || request.priority === priorityFilter;
    const matchesRequestType = !requestTypeFilter || request.request_type === requestTypeFilter;
    return matchesSearch && matchesPriority && matchesRequestType;
  });

  // Update stats to reflect filtered results
  const filteredStats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter((r: RequestData) => r.approval_status === 'pending').length,
    approved: filteredRequests.filter((r: RequestData) => r.approval_status === 'approved').length,
    underRevision: filteredRequests.filter((r: RequestData) => r.approval_status === 'revision_requested').length
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
  const paginated = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, priorityFilter, requestTypeFilter]);
  useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'revision_requested':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Pill badge classes for priority
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'revision_requested':
        return 'Under Revision';
      default:
        return status;
    }
  };

  const getDisplayPriority = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  };



  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-red-600">Request Management</h1>
            <p className="text-gray-600">Review and approve student requests.</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-black">{filteredStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting Approval</p>
                <p className="text-2xl font-bold text-black">{filteredStats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved by Dean</p>
                <p className="text-2xl font-bold text-black">{filteredStats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revision Requested</p>
                <p className="text-2xl font-bold text-black">{filteredStats.underRevision}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Edit className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-black bg-gray-50 transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          <RequestFilterDropdown
            status={''}
            priority={priorityFilter}
            requestType={requestTypeFilter}
            onChangeStatus={() => { /* no-op: status removed */ }}
            onChangePriority={(val) => setPriorityFilter(val)}
            onChangeRequestType={(val) => setRequestTypeFilter(val)}
            showStatus={false}
            showRequestType={true}
            showEquipmentType={false}
          />
        </div>

        {/* Batch Actions */}
        {selectedApprovals.length > 0 && (
          <div className="mb-4 flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-700 font-medium">
              {selectedApprovals.length} request{selectedApprovals.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBatchApprove}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Batch Approve ({selectedApprovals.length})
            </button>
          </div>
        )}

        {/* Table (unified layout) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col" style={{ minHeight: 590 }}>
          <div className="flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10">
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold tracking-wider text-gray-600 uppercase w-16">
                    <input
                      type="checkbox"
                      checked={selectedApprovals.length > 0 && selectedApprovals.length === paginated.filter(req => req.approval_status === 'pending').length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  {['Submitted by','Request Title','Request Type','Date & Time','Priority','Status','Actions'].map(h => (
                    <th
                      key={h}
                      className={`${h === 'Request Title' ? 'pl-2 pr-4' : 'px-6'} py-3 text-[11px] font-semibold tracking-wider text-black uppercase whitespace-nowrap`}
                      style={h === 'Request Title' ? { minWidth: '240px' } : undefined}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading && (
                  [...Array(PAGE_SIZE)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
                      {Array.from({length:6}).map((__, c) => (
                        <td key={c} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                )}
                {!loading && paginated.length > 0 && paginated.map(request => (
                  <tr key={request.approval_id} className="hover:bg-red-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.includes(request.approval_id)}
                        onChange={(e) => handleSelectIndividual(request.approval_id, e.target.checked)}
                        disabled={request.approval_status !== 'pending'}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{request.student_name || 'Unknown Student'}</td>
                    <td className="pl-2 pr-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {request.activity_title || request.activity_category || 'Untitled Request'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize whitespace-nowrap">
                      {request.request_type?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {request.submitted_at ? (
                        <div className="flex flex-col">
                          <span>{formatDateShort(request.submitted_at)}</span>
                          <span className="text-xs text-gray-500">{formatTime12h(request.submitted_at)}</span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(request.priority)}`}>
                        {getDisplayPriority(request.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.approval_status)}`}>
                        {getDisplayStatus(request.approval_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const type = request.request_type?.toLowerCase();
                          if (type === "activity_plan") {
                            router.visit(`/dean/activity-plan-approval/${request.approval_id}`);
                          } else if (type === "budget_request") {
                            router.visit(`/dean/budget-request-approval/${request.approval_id}`);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <div className="flex flex-col items-center justify-center text-center gap-3 text-gray-500" style={{height: '420px'}}>
                        <Inbox className="w-12 h-12 text-gray-300" />
                        <p className="text-sm font-medium">No requests match the current filters.</p>
                        <button
                          onClick={() => { setPriorityFilter(''); setSearchTerm(''); }}
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
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-6 py-3 border-t border-gray-100 bg-white">
            <div className="text-[11px] text-gray-500 order-2 sm:order-1 tracking-wide">
              {filteredRequests.length > 0 && !loading && (
                <>Showing <span className="font-medium text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-medium text-gray-700">{Math.min(currentPage * PAGE_SIZE, filteredRequests.length)}</span> of <span className="font-medium text-gray-700">{filteredRequests.length}</span></>
              )}
              {filteredRequests.length === 0 && !loading && 'No results'}
              {loading && 'Loading...'}
            </div>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <button
                className="h-8 px-3 rounded-md text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >Prev</button>
              <div className="h-8 px-3 flex items-center rounded-md text-xs font-semibold text-gray-700 bg-gray-50">
                {totalPages === 0 ? 1 : currentPage} / {totalPages || 1}
              </div>
              <button
                className="h-8 px-3 rounded-md text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >Next</button>
            </div>
          </div>
        </div>

        {/* Batch Approval Modal */}
        <BatchApprovalModal
          isOpen={batchApprovalModalOpen}
          onClose={() => setBatchApprovalModalOpen(false)}
          onConfirm={confirmBatchApproval}
          selectedRequests={selectedApprovals.map(id => ({ approval_id: id }))}
          userRole="dean"
        />
      </div>
    </MainLayout>
  );
}
