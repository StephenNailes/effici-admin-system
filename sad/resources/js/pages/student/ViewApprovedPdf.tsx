import React, { useState } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, FileText, CheckCircle2, Clock } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Plan {
  id: number;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
  pdf_url: string | null;
}

interface Props {
  plan: Plan;
}

export default function ViewApprovedPdf({ plan }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (!plan.pdf_url) return;
    
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = plan.pdf_url;
    link.download = `activity_plan_${plan.id}_approved.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handleBack = () => {
    router.get('/student/requests/activity-plan');
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      under_revision: 'bg-rose-100 text-rose-800',
      completed: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
    };

    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      under_revision: 'Under Revision',
      completed: 'Completed',
      draft: 'Draft',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.draft}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins min-h-screen bg-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Activity Requests</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-600 tracking-tight mb-2">
                Activity Plan #{plan.id}
              </h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(plan.status)}
                <span className="text-sm text-gray-500">
                  Priority Level: <span className="font-medium text-gray-700 capitalize">{plan.category}</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Banner for Approved Plans */}
        {plan.status === 'approved' && plan.pdf_url && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">Document Approved</h3>
              <p className="text-sm text-green-700">
                This activity plan has been approved by the dean. The document below contains the official signatures and is ready for implementation.
              </p>
            </div>
          </motion.div>
        )}

        {/* Warning Banner for Non-Approved Plans */}
        {plan.status !== 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3"
          >
            <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800 mb-1">Awaiting Dean Approval</h3>
              <p className="text-sm text-orange-700">
                This activity plan is currently under review. The PDF document will be available for viewing once the dean has approved and signed it.
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100"
        >
          {/* Document Header */}
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {plan.status === 'approved' ? 'Dean-Approved Document' : 'Activity Plan Status'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Only show download button for approved documents */}
                {plan.status === 'approved' && plan.pdf_url && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:shadow-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="p-6">
            {plan.status === 'approved' && plan.pdf_url ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src={`${plan.pdf_url}#toolbar=0&navpanes=0`}
                  className="w-full h-[800px] border-0"
                  title="Activity Plan PDF"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                <p className="text-lg font-medium mb-2 text-gray-700">Document Preview Not Available</p>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  {plan.status === 'pending' 
                    ? 'Your activity plan is currently being reviewed by the admin assistant and dean. The PDF will be available once it receives final approval and the dean\'s signature.'
                    : plan.status === 'under_revision'
                    ? 'This activity plan requires revisions. Please review the feedback and resubmit your document.'
                    : plan.status === 'draft'
                    ? 'Please complete and submit your activity plan for approval first.'
                    : 'The PDF document will be available once the approval process is complete.'}
                </p>
              </div>
            )}
          </div>

          {/* Document Info Footer */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(plan.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(plan.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
