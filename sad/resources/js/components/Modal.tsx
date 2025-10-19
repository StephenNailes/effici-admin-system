import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const openedAtRef = useRef<number>(0);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
    }
  }, [open]);

  // Lock body scroll when one or more modals are open. Use a dataset counter
  // to support multiple modal instances opened simultaneously.
  useEffect(() => {
    const body = document.body;
    const getCount = () => Number(body.dataset.modalCount || '0');
    const setCount = (n: number) => { body.dataset.modalCount = String(n); };

    const applyLock = () => {
      // only save original values when transitioning from 0 -> 1
      if (getCount() === 0) {
        // compute scrollbar width and add padding-right to avoid layout shift
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollBarWidth > 0) {
          body.style.paddingRight = `${scrollBarWidth}px`;
        }
        body.style.overflow = 'hidden';
      }
      setCount(getCount() + 1);
    };

    const removeLock = () => {
      const newCount = Math.max(0, getCount() - 1);
      setCount(newCount);
      if (newCount === 0) {
        // restore
        body.style.overflow = '';
        body.style.paddingRight = '';
        delete body.dataset.modalCount;
      }
    };

    if (open) applyLock();
    return () => {
      if (open) removeLock();
    };
  }, [open]);

  const safeClose = () => {
    const now = Date.now();
    if (now - openedAtRef.current < 150) {
      return; // ignore immediate overlay interaction right after opening
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Enhanced backdrop with blur effect across the entire page */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onMouseDown={safeClose}
          />

          {/* Modal content container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}