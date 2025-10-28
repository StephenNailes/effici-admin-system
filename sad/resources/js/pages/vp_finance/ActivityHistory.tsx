import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/layouts/mainlayout";
import { Eye, Search, CheckCircle, Edit, Clock, DollarSign } from "lucide-react";
import { csrfFetch } from "@/lib/csrf";
import { router } from "@inertiajs/react";
import { formatDateShort, formatTime12h } from "@/lib/utils";

interface HistoryItem {
  approval_id: number;
  request_title?: string;
  request_category?: string;
  student_name?: string;
  approved_at?: string;
  priority: 'low' | 'medium' | 'high';
  approval_status: 'pending' | 'approved' | 'revision_requested';
}

export default function VpFinanceActivityHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await csrfFetch('/api/approvals/history?role=vp_finance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item: HistoryItem) => {
    const matchesSearch = item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.request_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.request_title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const paginatedHistory = filteredHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'revision_requested':
        return <Edit className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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
      medium: 'bg-yellow-100 text-yellow-700',
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
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-600">Budget Request History</h1>
          <p className="text-gray-600 mt-1">View your budget request approval history (VP Finance)</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No budget request history found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Request</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Approved Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedHistory.map((item) => (
                      <tr key={item.approval_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.student_name || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-900">{item.request_title || item.request_category || 'Budget Request'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                        <td className="px-4 py-3">
                          {item.approved_at ? (
                            <>
                              <div className="text-sm text-gray-900">{formatDateShort(item.approved_at)}</div>
                              <div className="text-xs text-gray-500">{formatTime12h(item.approved_at)}</div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.approval_status)}`}>
                            {getStatusIcon(item.approval_status)}
                            {getStatusLabel(item.approval_status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleView(item.approval_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length} items
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
      </motion.div>
    </MainLayout>
  );
}
