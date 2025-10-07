import MainLayout from '@/layouts/mainlayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Briefcase, Building2, Clock } from 'lucide-react';
import { useState } from 'react';

type RequestItem = {
  id: number;
  user: { id: number; first_name?: string; last_name?: string; email: string; school_id?: string };
  requested_role: string;
  officer_organization?: string | null;
  officer_position?: string | null;
  election_date?: string | null;
  term_duration?: string | null;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  remarks?: string | null;
  created_at: string;
};

export default function RoleRequests() {
  const { requests } = usePage().props as any;
  const items: RequestItem[] = requests?.data ?? [];
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const process = (id: number, action: 'approve' | 'reject') => {
    router.patch(`/admin/role-requests/${id}`, { action }, {
      preserveScroll: true,
    });
  };

  const formatTermDuration = (term?: string | null) => {
    if (!term) return '-';
    const map: Record<string, string> = {
      '1_semester': '1 Semester',
      '1_year': '1 Academic Year',
      '2_years': '2 Years',
      'ongoing': 'Ongoing/Indefinite',
    };
    return map[term] || term;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-600">Student Officer Verification Requests</h1>
          <p className="text-gray-600">Review and verify elected student officers to grant Activity Plan access.</p>
        </div>

        <div className="space-y-4">
          {items.length === 0 && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center text-gray-500">
              No verification requests found.
            </div>
          )}

          {items.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50 to-white p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {r.user?.first_name} {r.user?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{r.user?.email}</p>
                      {r.user?.school_id && (
                        <p className="text-xs text-gray-500 mt-1">School ID: {r.user.school_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                        r.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : r.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.status === 'pending' ? '⏳ Pending' : r.status === 'approved' ? '✓ Verified' : '✗ Rejected'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Officer Details Grid */}
              <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Organization</p>
                    <p className="text-sm text-gray-900 font-medium">{r.officer_organization || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Position</p>
                    <p className="text-sm text-gray-900 font-medium">{r.officer_position || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Election Date</p>
                    <p className="text-sm text-gray-900">{formatDate(r.election_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Term Duration</p>
                    <p className="text-sm text-gray-900">{formatTermDuration(r.term_duration)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="p-6">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm mb-3"
                >
                  {expandedId === r.id ? '▼ Hide' : '▶ Show'} Additional Details
                </button>

                {expandedId === r.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Verification Details</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.reason || 'No additional details provided.'}</p>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              {r.status === 'pending' && (
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => process(r.id, 'approve')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    ✓ Verify & Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => process(r.id, 'reject')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    ✗ Reject
                  </motion.button>
                </div>
              )}

              {r.status !== 'pending' && r.remarks && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Admin Remarks</p>
                  <p className="text-sm text-gray-700">{r.remarks}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
