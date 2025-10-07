import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, UserCheck } from 'lucide-react';
import { router } from '@inertiajs/react';

interface RoleAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole: string;
  featureName: string;
}

export default function RoleAccessModal({ isOpen, onClose, requiredRole, featureName }: RoleAccessModalProps) {
  const handleRequestRole = () => {
    onClose();
    router.visit('/student/role-request');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {featureName} - Student Officer Only
                </h3>
                <p className="text-gray-600 text-sm">
                  This feature is restricted to <span className="font-semibold text-red-600">elected Student Officers</span>. 
                  If you're an elected officer, verify your status to gain access.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRequestRole}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <UserCheck className="w-5 h-5" />
                  Verify My Officer Status
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
