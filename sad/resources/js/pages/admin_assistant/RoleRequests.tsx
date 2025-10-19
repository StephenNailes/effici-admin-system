import MainLayout from '@/layouts/mainlayout';
import { usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Briefcase, Building2, Clock, ChevronDown, ChevronUp, Hourglass, BadgeCheck, CircleX, UserCheck2, UserX2 } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { useState } from 'react';
import { useInertiaSubmit } from '@/hooks/useInertiaSubmit';

type RequestUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  school_id?: string;
  profile_photo_url?: string | null;
};

type RequestItem = {
  id: number;
  user: RequestUser;
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
  const { submit } = useInertiaSubmit();

  const process = async (id: number, action: 'approve' | 'reject') => {
    await submit('patch', `/admin/role-requests/${id}`, { action }, {
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
    // Use shared utils for consistency
    const s = formatDateShort(dateStr);
    return s === '—' ? '-' : s.replace(/\b([A-Za-z]{3})\b/, (m) => ({Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December'} as any)[m] || m);
  };

  const formatShortDate = (dateStr?: string | null) => formatDateShort(dateStr);

  const getInitials = (u: RequestUser) => {
    const a = (u.first_name?.[0] || '').toUpperCase();
    const b = (u.last_name?.[0] || '').toUpperCase();
    const fallback = (!a && !b && u.email ? u.email[0].toUpperCase() : '');
    return (a + b) || fallback || '?';
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        <div className="mb-5">
          <h1 className="text-xl md:text-2xl font-bold text-red-600">Student Officer Verification Requests</h1>
          <p className="text-gray-600 text-sm">Review and verify elected student officers to grant Activity Plan access.</p>
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
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="bg-white p-5 border-b border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-h-[44px]">
                    {r.user?.profile_photo_url ? (
                      <img
                        src={r.user.profile_photo_url}
                        alt={`${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() || 'User avatar'}
                        className="w-11 h-11 rounded-full object-cover border border-red-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-red-600/10 text-red-700 border border-red-200 flex items-center justify-center font-semibold">
                        {getInitials(r.user)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {r.user?.first_name} {r.user?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-tight">{r.user?.email}</p>
                      {r.user?.school_id && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight">School ID: {r.user.school_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end justify-center gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        r.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.status === 'pending' && <Hourglass className="w-3.5 h-3.5" />}
                      {r.status === 'approved' && <BadgeCheck className="w-3.5 h-3.5" />}
                      {r.status === 'rejected' && <CircleX className="w-3.5 h-3.5" />}
                      {r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Verified' : 'Rejected'}
                    </span>
                    <p className="text-xs text-gray-500">Submitted {formatShortDate(r.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Officer Details Grid */}
              <div className="p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</p>
                    <p className="text-sm text-gray-900 font-medium mt-1.5">{r.officer_organization || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</p>
                    <p className="text-sm text-gray-900 font-medium mt-1.5">{r.officer_position || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Election Date</p>
                    <p className="text-sm text-gray-900 mt-1.5">{formatDate(r.election_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Term Duration</p>
                    <p className="text-sm text-gray-900 mt-1.5">{formatTermDuration(r.term_duration)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="p-5">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold text-sm mb-3"
                >
                  {expandedId === r.id ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Hide Additional Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> Show Additional Details
                    </>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {expandedId === r.id && (
                    <motion.div
                      key={`details-${r.id}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="bg-gray-50 rounded-md p-4 border border-gray-200"
                    >
                      <p className="text-xs font-semibold text-gray-900 uppercase mb-2 tracking-wide">Verification Details</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.reason || 'No additional details provided.'}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              {r.status === 'pending' && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => process(r.id, 'approve')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-md text-sm transition-colors"
                  >
                    <UserCheck2 className="w-4 h-4" />
                    Verify & Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => process(r.id, 'reject')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-md text-sm transition-colors"
                  >
                    <UserX2 className="w-4 h-4" />
                    Reject
                  </motion.button>
                </div>
              )}

              {r.status !== 'pending' && r.remarks && (
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 tracking-wide">Admin Remarks</p>
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
