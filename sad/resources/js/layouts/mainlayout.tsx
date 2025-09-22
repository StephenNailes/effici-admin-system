import Sidebar from '@/components/sidebar'
import { AnimatePresence, motion } from 'framer-motion'
import FlashToaster from '@/components/FlashToaster'
// ToastContainer is provided globally in app.tsx

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 bg-white p-6 ml-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
  </main>
  {/* Toast listener lives under Inertia context to avoid usePage error */}
  <FlashToaster />
    </div>
  )
}

