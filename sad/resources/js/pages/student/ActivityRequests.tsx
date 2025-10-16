import React from 'react';
import MainLayout from '@/layouts/mainlayout';
import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlanSummary {
  id: number;
  status: 'draft' | 'pending' | 'under_revision' | 'approved' | 'completed';
  created_at?: string;
  updated_at?: string;
  file_url?: string | null;
}

type DashboardProps = {
  counts: {
    total: number;
    pending: number;
    approved: number;
    needsRevision: number;
  };
  recent: PlanSummary[];
  submitted: Pick<PlanSummary, 'id' | 'status' | 'created_at' | 'updated_at'>[];
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

export default function ActivityRequests() {
  const page = usePage();
  const { counts, recent, submitted, submittedPagination } = (page.props as any) as DashboardProps;

  const gotoSubmittedPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > submittedPagination.last_page) return;
    router.get('/student/requests/activity-plan', { submitted_page: pageNum }, { preserveScroll: true, preserveState: true });
  };

  const handleCreate = () => {
    router.post('/student/requests/activity-plan/create-draft', { category: 'normal' }, {
      preserveScroll: true,
    });
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins min-h-screen text-black bg-white">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">Activity Requests</h1>
          <p className="text-gray-600 text-base">Manage your organization’s activity requests.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText className="text-blue-600" />} label="Total Act. Requests" value={counts.total} color="bg-blue-50" delay={0.00} />
          <StatCard icon={<Clock className="text-orange-600" />} label="Pending Act. Requests" value={counts.pending} color="bg-orange-50" delay={0.05} />
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
              + Create Document
            </motion.button>
          </div>
          {submitted.length === 0 ? (
            <div className="text-sm text-gray-400">No submitted activity plans yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {submitted.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <button
                    onClick={() => router.get(`/student/requests/activity-plan/${s.id}`)}
                    className="text-left"
                  >
                    <div className="text-sm font-medium text-black">Activity Plan #{s.id}</div>
                    <div className="text-xs text-black">{s.status}</div>
                  </button>
                  <div className="text-xs text-black">
                    {s.updated_at ? new Date(s.updated_at).toLocaleString() : ''}
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

        {/* Recent Document Previews (like Google Docs thumbnails) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Recent documents</h2>
            {/* Right-side controls intentionally omitted per request */}
          </div>
          {recent.length === 0 ? (
            <div className="text-gray-400 text-sm">No documents yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recent.map((doc, idx) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group text-left"
                  onClick={() => router.get(`/student/requests/activity-plan/${doc.id}`)}
                >
                  <img
                    src={`/student/requests/activity-plan/${doc.id}/thumbnail`}
                    alt={`Document ${doc.id} preview`}
                    className="aspect-[8.5/11] w-full object-cover bg-white border border-gray-200 rounded-lg shadow overflow-hidden"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const ph = target.nextElementSibling as HTMLElement | null;
                      if (ph) ph.style.display = 'flex';
                    }}
                  />
                  <div className="hidden aspect-[8.5/11] w-full bg-white border border-gray-200 rounded-lg shadow overflow-hidden items-center justify-center text-gray-300">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-800 truncate">{`Document #${doc.id}`}</div>
                    <div className="text-xs text-gray-500">{doc.status}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
