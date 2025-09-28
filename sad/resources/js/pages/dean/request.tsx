import React, { useState, useEffect } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { Search, Filter, Eye, FileText, Clock, CheckCircle, Edit, ChevronDown, Check, Minus } from 'lucide-react';
import BatchApprovalModal from '@/components/BatchApprovalModal';
import { router } from '@inertiajs/react';
import { formatDateShort, formatTime12h } from '@/lib/utils';
import { toast } from 'react-toastify';

interface RequestData {
  approval_id: number;
  student_name: string;
  activity_name?: string;
  request_type: 'activity_plan';
  submitted_at: string;
  priority: 'minor' | 'normal' | 'urgent';
  approval_status: 'pending' | 'approved' | 'revision_requested';
}





export default function Request() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, underRevision: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedApprovals, setSelectedApprovals] = useState<number[]>([]);
  const [batchApprovalModalOpen, setBatchApprovalModalOpen] = useState(false);

  // Fetch dean requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch dean approval requests from the API
      const response = await fetch('/api/approvals?role=dean', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
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

  // Filter requests based on search term, status, and priority
  // Dean ONLY handles activity plans, NOT equipment requests
  const filteredRequests = requests.filter((request: RequestData) => {
    // First filter: Only show activity plans (exclude equipment)
    if (request.request_type !== 'activity_plan') {
      return false;
    }
    
    const matchesSearch = request.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.activity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || request.approval_status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Update stats to reflect filtered results
  const filteredStats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter((r: RequestData) => r.approval_status === 'pending').length,
    approved: filteredRequests.filter((r: RequestData) => r.approval_status === 'approved').length,
    underRevision: filteredRequests.filter((r: RequestData) => r.approval_status === 'revision_requested').length
  };

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
      case 'urgent':
        return 'text-red-600';
      case 'normal':
        return 'text-blue-600';
      case 'minor':
        return 'text-green-600';
      default:
        return 'text-gray-600';
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
      case 'urgent':
        return 'Urgent';
      case 'normal':
        return 'Normal';
      case 'minor':
        return 'Minor';
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
            <h1 className="text-2xl font-bold text-black">Activity Plan Approval</h1>
            <p className="text-gray-600">Review and approve student activity plans.</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activity Plans</p>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
            >
              <Filter className="w-5 h-5" />
              Filter
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1 text-sm text-black"
                    >
                      <option value="All">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="revision_requested">Under Revision</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select 
                      value={priorityFilter} 
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1 text-sm text-black"
                    >
                      <option value="All">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="normal">Normal</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => setFilterOpen(false)}
                    className="w-full bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    <input
                      type="checkbox"
                      checked={selectedApprovals.length > 0 && selectedApprovals.length === filteredRequests.filter(req => req.approval_status === 'pending').length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted by
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        <Clock className="w-8 h-8 mx-auto text-gray-300 mb-4 animate-spin" />
                        <p className="text-sm">Loading requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.approval_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedApprovals.includes(request.approval_id)}
                          onChange={(e) => handleSelectIndividual(request.approval_id, e.target.checked)}
                          disabled={request.approval_status !== 'pending'}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {request.student_name || 'Unknown Student'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{request.activity_name || 'Activity Plan'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {request.submitted_at ? (
                            <>
                            <div>{formatDateShort(request.submitted_at)}</div>
                            <div className="text-gray-500 text-xs">{formatTime12h(request.submitted_at)}</div>
                            </>
                          ) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                          {getDisplayPriority(request.priority)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.approval_status)}`}>
                          {getDisplayStatus(request.approval_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => router.visit(`/dean/activity-plan-approval/${request.approval_id}`)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-5 h-5 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium mb-2">No activity plans found</p>
                        <p className="text-sm">No activity plans require dean approval at this time</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
