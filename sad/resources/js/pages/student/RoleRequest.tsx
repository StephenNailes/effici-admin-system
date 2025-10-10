import MainLayout from '@/layouts/mainlayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Info, ArrowLeft } from 'lucide-react';
import type { PageProps } from '@/types';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function RoleRequest() {
  const { auth, flash } = usePage<PageProps>().props as any;
  const user = auth?.user;
  const [submitted, setSubmitted] = useState(false);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    requested_role: 'student_officer' as const,
    officer_organization: '',
    officer_position: '',
    election_date: '',
    term_duration: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    post('/student/role-request', {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setSubmitted(true);
        // Hide success message after 8 seconds
        setTimeout(() => setSubmitted(false), 8000);
      },
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen p-8 font-poppins text-black">
        {/* Back Button */}
        <motion.button
          onClick={() => router.visit('/profile')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </motion.button>

        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4"
            >
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-green-900 mb-1">Verification Request Submitted!</h3>
                <p className="text-green-800 text-sm">
                  The Admin Assistant will verify your officer status and approve access within 1-2 business days.
                </p>
              </div>
            </motion.div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-red-600">Student Officer Verification</h1>
                  <p className="text-gray-500 text-sm">Verify your elected officer status</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                As an elected student officer, please provide your details below so we can verify your position and grant you access to Activity Plan features.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization/Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  CCS Organization/Club {!data.officer_organization && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-colors outline-none"
                  placeholder="e.g., Programming Club, Game Development Society"
                  value={data.officer_organization}
                  onChange={(e) => setData('officer_organization', e.target.value)}
                  required
                />
                {errors.officer_organization && <p className="text-red-600 text-sm mt-2">{errors.officer_organization}</p>}
              </div>

              {/* Officer Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Officer Position {!data.officer_position && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-colors outline-none"
                  placeholder="e.g., President, Vice President, Secretary, Event Coordinator"
                  value={data.officer_position}
                  onChange={(e) => setData('officer_position', e.target.value)}
                  required
                />
                {errors.officer_position && <p className="text-red-600 text-sm mt-2">{errors.officer_position}</p>}
              </div>

              {/* Election/Appointment Date and Term Duration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Election/Appointment Date {!data.election_date && <span className="text-red-600">*</span>}
                    </label>
                    <div className="relative group">
                      <Info 
                        className="w-4 h-4 text-gray-400 cursor-help"
                        onMouseEnter={() => setShowDateTooltip(true)}
                        onMouseLeave={() => setShowDateTooltip(false)}
                      />
                      {showDateTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute left-0 top-6 z-50 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl"
                        >
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          If you cannot remember the exact election date, please provide your best estimate.
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-colors outline-none"
                    value={data.election_date}
                    onChange={(e) => setData('election_date', e.target.value)}
                    required
                  />
                  {errors.election_date && <p className="text-red-600 text-sm mt-2">{errors.election_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Term Duration {!data.term_duration && <span className="text-red-600">*</span>}
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-colors outline-none"
                    value={data.term_duration}
                    onChange={(e) => setData('term_duration', e.target.value)}
                    required
                  >
                    <option value="">Select term duration</option>
                    <option value="1_semester">1 Semester</option>
                    <option value="1_year">1 Academic Year</option>
                    <option value="2_years">2 Years</option>
                    <option value="ongoing">Ongoing/Indefinite</option>
                  </select>
                  {errors.term_duration && <p className="text-red-600 text-sm mt-2">{errors.term_duration}</p>}
                </div>
              </div>

              {/* Additional Verification Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Additional Details {!data.reason && <span className="text-red-600">*</span>}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Please provide any additional information to help verify your officer status (e.g., election results or advisor name)
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-colors resize-none outline-none"
                  rows={5}
                  placeholder="Example: I was elected as President during our General Assembly on September 15, 2024. Our organization advisor is Prof. Maria Santos."
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value)}
                  required
                />
                {errors.reason && <p className="text-red-600 text-sm mt-2">{errors.reason}</p>}
              </div>

              {/* Information Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 text-sm">
                  <strong>Note:</strong> The Admin Assistant may contact your organization advisor or check official records to verify your officer status before approval.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={processing}
                className="w-full bg-[#e6232a] hover:bg-[#d01e24] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-colors text-base shadow-lg"
              >
                {processing ? 'Submitting Verification...' : 'Submit for Verification'}
              </motion.button>
            </form>
          </div>
        </div>

        {/* Confirmation Modal Component */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmSubmit}
          processing={processing}
          data={data}
        />
      </div>
    </MainLayout>
  );
}
