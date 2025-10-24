import React from 'react';
import Modal from '@/components/Modal';
import { FileText, X } from 'lucide-react';

export interface GeneratePdfConfirmModalProps {
  open: boolean;
  processing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function GeneratePdfConfirmModal({ open, processing = false, onCancel, onConfirm }: GeneratePdfConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Generate final PDF?</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="mt-3 text-sm text-gray-700 leading-relaxed">
        Generate final PDF for this activity plan?
      </div>

      {/* Footer */}
      <div className="mt-5 flex justify-end gap-2">
        <button
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
          onClick={onConfirm}
          disabled={processing}
        >
          {processing ? 'Generating…' : 'Generate PDF'}
        </button>
      </div>
    </Modal>
  );
}
