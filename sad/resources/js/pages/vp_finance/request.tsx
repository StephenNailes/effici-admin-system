import React, { useState, useEffect } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { Search, Eye, FileText, Clock, CheckCircle, Edit, Check, Minus, Inbox, DollarSign } from 'lucide-react';
import RequestFilterDropdown from '@/components/RequestFilterDropdown';
import BatchApprovalModal from '@/components/BatchApprovalModal';
import { router } from '@inertiajs/react';
import { formatDateShort, formatTime12h } from '@/lib/utils';
import { toast } from 'react-toastify';
import { csrfFetch } from '@/lib/csrf';

interface RequestData {
  approval_id: number;
  student_name: string;
  request_title?: string;
  request_category?: string;
  request_type: 'budget_request';
  submitted_at: string;
  priority: 'low' | 'medium' | 'high';
  approval_status: 'pending' | 'approved' | 'revision_requested';
}

export default function Request() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, underRevision: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedApprovals, setSelectedApprovals] = useState<number[]>([]);
  const [batchApprovalModalOpen, setBatchApprovalModalOpen] = useState(false);
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const response = await csrfFetch('/api/approvals?role=vp_finance', {
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
        fetchRequests();
        setSelectedApprovals([]);
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

  const filteredRequests = requests.filter((request: RequestData) => {
    if (request.request_type !== 'budget_request') {
      return false;
    }
    
    const matchesSearch = request.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = !priorityFilter || request.priority === priorityFilter;
    const matchesStatus = !statusFilter || request.approval_status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const filteredStats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.approval_status === 'pending').length,
    approved: filteredRequests.filter(r => r.approval_status === 'approved').length,
    underRevision: filteredRequests.filter(r => r.approval_status === 'revision_requested').length
  };

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);

  const pendingFilteredCount = filteredRequests.filter(r => r.approval_status === 'pending').length;
  const allPendingSelected = pendingFilteredCount > 0 && selectedApprovals.length === pendingFilteredCount;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'revision_requested':
        return <Edit className="w-4 h-4 text-rose-500" />;
      default:
        return <Inbox className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'revision_requested':
        return 'Under Revision';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'revision_requested':
        return 'text-rose-600 bg-rose-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const handleView = (approvalId: number) => {
    router.visit(`/vp-finance/budget-request-approval/${approvalId}`);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-600">Budget Requests</h1>
          <p className="text-gray-600 mt-1">Review and approve budget requests (VP Finance)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.total}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Clock className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.pending}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.approved}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Edit className="w-8 h-8 text-rose-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Under Revision</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.underRevision}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <RequestFilterDropdown
              status={statusFilter}
              priority={priorityFilter}
              onChangeStatus={setStatusFilter}
              onChangePriority={setPriorityFilter}
              showStatus={true}
            />
          </div>

          {selectedApprovals.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {selectedApprovals.length} request(s) selected
              </span>
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve Selected
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No budget requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Request</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRequests.map((request) => {
                      const isPending = request.approval_status === 'pending';
                      return (
                        <tr key={request.approval_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {isPending && (
                              <input
                                type="checkbox"
                                checked={selectedApprovals.includes(request.approval_id)}
                                onChange={(e) => handleSelectIndividual(request.approval_id, e.target.checked)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{request.student_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-gray-900">{request.request_title || 'Budget Request'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{getPriorityBadge(request.priority)}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{formatDateShort(request.submitted_at)}</div>
                            <div className="text-xs text-gray-500">{formatTime12h(request.submitted_at)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.approval_status)}`}>
                              {getStatusIcon(request.approval_status)}
                              {getStatusLabel(request.approval_status)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleView(request.approval_id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredRequests.length)} of {filteredRequests.length} requests
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BatchApprovalModal
        isOpen={batchApprovalModalOpen}
        onClose={() => setBatchApprovalModalOpen(false)}
        onConfirm={confirmBatchApproval}
        selectedRequests={selectedApprovals.map(id => ({ id, title: 'Budget Request', request_type: 'budget_request' }))}
        userRole="vp_finance"
      />
    </MainLayout>
  );
}
