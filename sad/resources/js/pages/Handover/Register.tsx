import MainLayout from '@/layouts/mainlayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, UserCheck, AlertTriangle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PageProps } from '@/types';

type HandoverPageProps = PageProps & { role: 'dean' | 'admin_assistant'; pendingCount: number; errors?: Record<string, string> };

export default function HandoverRegister() {
  const { role, pendingCount, errors: pageErrors } = usePage<HandoverPageProps>().props;

  const roleLabel = useMemo(() => (role === 'admin_assistant' ? 'Admin Assistant' : 'Dean'), [role]);

  const { data, setData, post, processing, errors } = useForm<Record<string, string>>({
    role,
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    reason: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // This page should not be scrollable
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = (document.documentElement.style as any).overscrollBehavior;
    const prevBodyOverscroll = (document.body.style as any).overscrollBehavior;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    (document.documentElement.style as any).overscrollBehavior = 'none';
    (document.body.style as any).overscrollBehavior = 'none';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      (document.documentElement.style as any).overscrollBehavior = prevHtmlOverscroll;
      (document.body.style as any).overscrollBehavior = prevBodyOverscroll;
    };
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (showConfirmModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showConfirmModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmHandover = () => {
    setShowConfirmModal(false);
    post('/admin/handover/perform-new', {
      preserveScroll: true,
      onSuccess: () => {
        // After successful handover, log out to switch accounts
        setTimeout(() => router.post('/logout'), 1200);
      },
    });
  };

  return (
    <MainLayout>
      <Head title={`Hand Over ${roleLabel}`} />
  <div className="p-8 font-poppins h-screen overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="text-[#e6232a] w-5 h-5" />
            <h1 className="text-2xl font-bold text-[#e6232a]">Hand Over {roleLabel} Role</h1>
          </div>
          <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </Link>
        </div>

        {/* Center the two cards in the middle of the page */}
  <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">New {roleLabel}'s Details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[15px] font-medium text-gray-900 mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#e6232a] focus:outline-none focus:ring-0"
                    value={data.first_name}
                    onChange={(e) => setData('first_name', e.target.value)}
                    placeholder="e.g., John"
                  />
                  {errors['first_name'] && <p className="text-red-600 text-xs mt-1">{errors['first_name']}</p>}
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-900 mb-2">Middle Name (Optional)</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#e6232a] focus:outline-none focus:ring-0"
                    value={data.middle_name}
                    onChange={(e) => setData('middle_name', e.target.value)}
                    placeholder="e.g., Santos"
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-900 mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#e6232a] focus:outline-none focus:ring-0"
                    value={data.last_name}
                    onChange={(e) => setData('last_name', e.target.value)}
                    placeholder="e.g., Dela Cruz"
                  />
                  {errors['last_name'] && <p className="text-red-600 text-xs mt-1">{errors['last_name']}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[15px] font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#e6232a] focus:outline-none focus:ring-0"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="name@example.com"
                  />
                  {errors['email'] && <p className="text-red-600 text-xs mt-1">{errors['email']}</p>}
                  {pageErrors && (pageErrors as Record<string, string>).handover &&
                    String((pageErrors as Record<string, string>).handover).toLowerCase().includes('student') && (
                      <p className="text-red-600 text-xs mt-1">{(pageErrors as Record<string, string>).handover}</p>
                  )}
                  <p className="text-[13px] text-gray-500 mt-1">An invitation email will be sent to this address</p>
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-900 mb-2">Reason for Handover (Optional)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#e6232a] focus:outline-none focus:ring-0 resize-none"
                  rows={4}
                  placeholder="e.g., End of term, promotion, etc."
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value)}
                />
              </div>

              {pageErrors && (pageErrors as Record<string, string>).handover && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{(pageErrors as Record<string, string>).handover}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-[15px] leading-relaxed">
                  This will send an invitation email to the new {roleLabel} and transfer all pending approvals. You will be logged out after the handover is complete.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={processing || !data.first_name.trim() || !data.last_name.trim() || !data.email.trim()}
                  className="bg-[#e6232a] hover:bg-[#d01e24] text-white px-5 py-2.5 rounded-lg text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  {processing ? 'Sending Invitation…' : 'Send Invitation & Complete Handover'}
                </button>
                <Link href="/profile" className="px-4 py-2 text-gray-600 hover:text-gray-800 text-[15px] font-medium">Cancel</Link>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-10 flex flex-col min-h-[28rem]">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Handover Impact</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#e6232a] mb-3">{pendingCount}</div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Pending approval{pendingCount !== 1 ? 's' : ''} will be transferred to the new {roleLabel.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-[13px] text-gray-500 text-center">
                This action is irreversible and will log you out immediately
              </p>
            </div>
          </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  You are about to transfer the {roleLabel} role to{' '}
                  <span className="font-semibold text-gray-900">{data.email}</span>.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending approvals to transfer:</span>
                    <span className="font-semibold text-gray-900">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">You will be logged out:</span>
                    <span className="font-semibold text-orange-600">Immediately</span>
                  </div>
                </div>
                <p className="text-orange-700 text-sm mt-3 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmHandover}
                  disabled={processing}
                  className="flex-1 bg-[#e6232a] hover:bg-[#d01e24] disabled:bg-[#e6232a]/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Complete Handover
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={processing}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
