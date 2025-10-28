import React from 'react';
import MainLayout from '@/layouts/mainlayout';
import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle2, Pencil, ChevronLeft, ChevronRight, Eye, Edit } from 'lucide-react';
import InfoModal from '@/components/InfoModal';

interface BudgetRequestSummary {
  id: number;
  request_name?: string;
  status: 'draft' | 'pending' | 'under_revision' | 'approved' | 'completed';
  created_at?: string;
  updated_at?: string;
  category?: 'low' | 'medium' | 'high';
  file_url?: string | null;
}

type BudgetRequestProps = {
  counts: {
    total: number;
    pending: number;
    approved: number;
    needsRevision: number;
  };
  recent: BudgetRequestSummary[];
  submitted: Pick<BudgetRequestSummary, 'id' | 'request_name' | 'status' | 'created_at' | 'updated_at' | 'category'>[];
  submittedPagination: {
    current_page: number;
    last_page: number;
    has_more_pages: boolean;
    per_page: number;
    total: number;
  };
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string; delay?: number }> = ({ icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  </motion.div>
);

export default function BudgetRequest() {
  const page = usePage();
  const { counts, recent, submitted, submittedPagination } = (page.props as any) as BudgetRequestProps;

  const gotoSubmittedPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > submittedPagination.last_page) return;
    router.get('/student/requests/budget-request', { submitted_page: pageNum }, { preserveScroll: true, preserveState: true });
  };

  const handleCreate = () => {
    // Navigate to editor without creating a DB record
    // User must manually save draft to create the record
    router.get('/student/requests/budget-request/new');
  };

  const handleViewPdf = (requestId: number) => {
    router.get(`/student/requests/budget-request/${requestId}/view-pdf`);
  };

  const handleEdit = (requestId: number) => {
    router.get(`/student/requests/budget-request/${requestId}`);
  };
  const [guardOpen, setGuardOpen] = React.useState(false);
  const [guardMessage, setGuardMessage] = React.useState<React.ReactNode>('');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-orange-600 bg-orange-50',
      approved: 'text-green-600 bg-green-50',
      under_revision: 'text-rose-600 bg-rose-50',
      completed: 'text-blue-600 bg-blue-50',
      draft: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      under_revision: 'Under Revision',
      completed: 'Completed',
      draft: 'Draft',
    };
    return labels[status] || status;
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins min-h-screen text-black bg-white">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">Budget Request</h1>
          <p className="text-gray-600 text-base">Manage your organization's budget requests.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<DollarSign className="text-blue-600" />} label="Total Requests" value={counts.total} color="bg-blue-50" delay={0.00} />
          <StatCard icon={<Clock className="text-orange-600" />} label="Pending Requests" value={counts.pending} color="bg-orange-50" delay={0.05} />
          <StatCard icon={<CheckCircle2 className="text-green-600" />} label="Approved" value={counts.approved} color="bg-green-50" delay={0.10} />
          <StatCard icon={<Pencil className="text-rose-600" />} label="Needs Revision" value={counts.needsRevision} color="bg-rose-50" delay={0.15} />
        </div>

        {/* Submitted card with Create button and list */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">Submitted Requests</div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:shadow-xl focus:outline-none"
            >
              + Create Budget Request
            </motion.button>
          </div>
          {submitted.length === 0 ? (
            <div className="text-sm text-gray-400">No submitted budget requests yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {submitted.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black">
                      {(s.request_name && s.request_name.trim()) || `Budget Request #${s.id}`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(s.status)}`}>
                        {getStatusLabel(s.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {s.updated_at ? new Date(s.updated_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Show View button ONLY for approved requests */}
                    {s.status === 'approved' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewPdf(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
                        title="View Approved Budget Request"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                    )}
                    {/* Show Edit button for draft and under_revision */}
                    {(s.status === 'draft' || s.status === 'under_revision') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                        title="Edit Budget Request"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </motion.button>
                    )}
                    {/* For pending status: no action (approval in progress) */}
                    {s.status === 'pending' && (
                      <div className="text-xs text-gray-500 italic px-3 py-1.5">
                        Awaiting approval...
                      </div>
                    )}
                    {/* For completed: show View button */}
                    {s.status === 'completed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewPdf(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                        title="View Completed Budget Request"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* Pagination controls */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => gotoSubmittedPage(submittedPagination.current_page - 1)}
              disabled={submittedPagination.current_page <= 1}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs text-black tabular-nums">
              {submittedPagination.current_page} / {submittedPagination.last_page}
            </div>
            <button
              onClick={() => gotoSubmittedPage(submittedPagination.current_page + 1)}
              disabled={submittedPagination.current_page >= submittedPagination.last_page}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Recent Document Previews */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Recent documents</h2>
          </div>
          {recent.length === 0 ? (
            <div className="text-gray-400 text-sm">No documents yet.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {recent.map((doc, idx) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group text-left"
                  onClick={() => {
                    if (doc.status === 'pending') {
                      setGuardMessage(
                        <span>
                         The budget request is currently under review by the admin. You cannot edit this file unless you are asked to make revisions.
                        </span>
                      );
                      setGuardOpen(true);
                      return;
                    }
                    if (doc.status === 'approved') {
                      setGuardMessage(
                        <span>
                         The budget request has been approved. Editing is disabled for approved files.
                        </span>
                      );
                      setGuardOpen(true);
                      return;
                    }
                    router.get(`/student/requests/budget-request/${doc.id}`);
                  }}
                >
                  <img
                    src={`/student/requests/budget-request/${doc.id}/thumbnail`}
                    alt={`Budget Request ${doc.id} preview`}
                    className="aspect-[1/1.414] w-full object-cover bg-white border border-gray-200 rounded-lg shadow overflow-hidden"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const ph = target.nextElementSibling as HTMLElement | null;
                      if (ph) ph.style.display = 'flex';
                    }}
                  />
                  <div className="hidden aspect-[1/1.414] w-full bg-white border border-gray-200 rounded-lg shadow overflow-hidden items-center justify-center text-gray-300">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {(doc.request_name && doc.request_name.trim()) || `Budget Request #${doc.id}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
        {/* Guard modal */}
        <InfoModal
          open={guardOpen}
          onClose={() => setGuardOpen(false)}
          variant="warning"
          title="Action blocked"
          message={guardMessage}
        />
      </div>
    </MainLayout>
  );
}
