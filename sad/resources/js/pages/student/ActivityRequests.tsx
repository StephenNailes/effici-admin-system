import React, { useEffect, useRef, useState } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, Pencil } from 'lucide-react';

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
  const { counts, recent } = (page.props as any) as DashboardProps;

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

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 flex items-center justify-between"
        >
          <div className="font-semibold text-gray-900">Your Submitted Requests</div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:shadow-xl focus:outline-none"
          >
            + Create Document
          </motion.button>
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
                  {doc.file_url ? (
                    <DocumentThumbnail url={doc.file_url} />
                  ) : (
                    <div className="aspect-[8.5/11] w-full bg-white border border-gray-200 rounded-lg shadow overflow-hidden flex items-center justify-center text-gray-300">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
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

// Helper: display a scaled first-page preview from an HTML document URL (same-origin)
const DocumentThumbnail: React.FC<{ url: string }> = ({ url }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoaded(true);
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Hide everything except the first ".page" if present
        let first: HTMLElement | null = null;
        const pages = Array.from(doc.querySelectorAll<HTMLElement>('.page'));
        if (pages.length > 0) {
          pages.forEach((el, i) => {
            if (i > 0) el.style.display = 'none';
            el.style.boxShadow = 'none';
            el.style.border = 'none';
          });
          first = pages[0];
        } else {
          // Fallback: try a root container typical from our saved HTML
          first = (doc.querySelector('#app') as HTMLElement) || (doc.body.firstElementChild as HTMLElement) || doc.body as HTMLElement;
        }

        if (first) {
          // Measure and scale to fit the card width
          // parentElement of iframe is the card; its clientWidth is our target width
          const container = iframe.parentElement as HTMLElement | null;
          if (!container) return;

          // Ensure body background is white
          doc.body.style.background = '#fff';

          // Compute scale
          // If width is 0 (not yet laid out), delay a tick
          const fit = () => {
            const rect = first!.getBoundingClientRect();
            const pageWidth = rect.width || (first as HTMLElement).offsetWidth;
            const pageHeight = rect.height || (first as HTMLElement).offsetHeight;
            if (!pageWidth || !pageHeight) return;
            const containerWidth = container.clientWidth;
            const scale = Math.max(0.1, Math.min(1.0, containerWidth / pageWidth));

            // Wrap scaling around the first page's parent to avoid affecting fixed headers
            const wrapper = first!.parentElement as HTMLElement | null;
            if (wrapper) {
              wrapper.style.transformOrigin = 'top left';
              wrapper.style.transform = `scale(${scale})`;
            } else {
              (first as HTMLElement).style.transformOrigin = 'top left';
              (first as HTMLElement).style.transform = `scale(${scale})`;
            }

            // Set iframe height to scaled page height to avoid scrollbars
            iframe.style.height = `${pageHeight * scale}px`;
          };

          // Initial fit and on resize
          fit();
          // ResizeObserver for responsive scaling
          const ro = new ResizeObserver(() => fit());
          ro.observe(container);
          // Cleanup
          const cleanup = () => ro.disconnect();
          iframe.addEventListener('load', cleanup, { once: true });
        }
      } catch (e) {
        // Swallow cross-origin errors silently
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [url]);

  return (
    <div className="relative aspect-[8.5/11] w-full bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
      <iframe
        ref={iframeRef}
        src={url}
        className="absolute inset-0 w-full h-full pointer-events-none"
        title="Document preview"
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <FileText className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}
