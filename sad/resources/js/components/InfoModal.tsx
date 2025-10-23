import React from 'react';
import Modal from '@/components/Modal';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type InfoModalVariant = 'info' | 'success' | 'warning';

export interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string | React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  variant?: InfoModalVariant;
}

export default function InfoModal({
  open,
  onClose,
  title,
  message,
  primaryLabel = 'OK',
  onPrimary,
  variant = 'info',
}: InfoModalProps) {
  const handlePrimary = () => {
    onPrimary?.();
    onClose();
  };

  const icon = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle2 className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  }[variant];

  const iconClasses = {
    info: 'bg-red-100 text-red-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-700',
  }[variant];

  const titleText = title ?? (
    variant === 'success' ? 'Success' : variant === 'warning' ? 'Notice' : 'Heads up'
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex items-center justify-center w-9 h-9 rounded-full ${iconClasses}`}>
          {icon}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-3">
        <h3 className="text-lg font-semibold text-gray-900">{titleText}</h3>
        <div className="mt-2 text-sm text-gray-700 leading-relaxed">{message}</div>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={handlePrimary}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          {primaryLabel}
        </button>
      </div>
    </Modal>
  );
}
