import React from 'react';
import Modal from './Modal';
import { X, Mail, Building2 } from 'lucide-react';

export interface HeaderSettingsModalProps {
  isOpen: boolean;
  headerEmail: string;
  headerSociety: string;
  onChangeEmail: (v: string) => void;
  onChangeSociety: (v: string) => void;
  onClose: () => void;
}

export default function HeaderSettingsModal({
  isOpen,
  headerEmail,
  headerSociety,
  onChangeEmail,
  onChangeSociety,
  onClose,
}: HeaderSettingsModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="no-print">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900">Header Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Header Email</label>
            <div className="mt-1 relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={headerEmail}
                onChange={(e) => onChangeEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                placeholder="e.g. sites@uic.edu.ph"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Organization / Society Name</label>
            <div className="mt-1 relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400">
                <Building2 className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={headerSociety}
                onChange={(e) => onChangeSociety(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                placeholder="Society of …"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
