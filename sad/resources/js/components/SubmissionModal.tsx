import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCircle2, ChevronDown, Flag, Info, Type as TypeIcon, X } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

export interface SubmissionModalProps {
  isOpen: boolean;
  onConfirm: (data: { planName: string; priority: 'low' | 'medium' | 'high' }) => void;
  onCancel: () => void;
  requestType?: 'activity_plan' | 'budget_request'; // Determines modal labels/text
}

export default function SubmissionModal({ isOpen, onConfirm, onCancel, requestType = 'activity_plan' }: SubmissionModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [planName, setPlanName] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showPriorityInfo, setShowPriorityInfo] = useState(false);

  // Dynamic labels based on request type
  const isBudgetRequest = requestType === 'budget_request';
  const modalTitle = isBudgetRequest ? 'Submit Budget Request' : 'Submit Activity Plan';
  const nameLabel = isBudgetRequest ? 'Budget Request Name' : 'Activity Plan Name';
  const namePlaceholder = isBudgetRequest ? 'e.g., Q1 2024 Equipment Budget' : 'e.g., Outreach Program - Barangay 12';
  const confirmText = isBudgetRequest ? 'Set a clear name and priority for your budget request, ensure that you have already generated the PDF, then confirm to send it for approval.' : 'Set a clear name and priority for your activity plan, ensure that you have already generated the PDF, then confirm to send it for approval.';

  const canConfirm = useMemo(() => {
    return isChecked && planName.trim().length > 0;
  }, [isChecked, planName]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({ planName: planName.trim(), priority });
    setIsChecked(false);
    setPlanName('');
    setPriority('medium');
  };

  const handleCancel = () => {
    setIsChecked(false);
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-100"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.6 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
          >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-100 text-red-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="submission-modal-title" className="text-lg font-semibold text-gray-900">{modalTitle}</h2>
                    <p className="text-xs text-gray-500">Review details before sending for approval</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <p className="text-gray-700 leading-relaxed">
                  {confirmText}
                </p>

                {/* Plan Name */}
                <div>
                  <label htmlFor="plan-name" className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                    <TypeIcon className="w-4 h-4 text-red-600" /> {nameLabel}
                  </label>
                  <input
                    id="plan-name"
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder={namePlaceholder}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-shadow"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">A concise title helps reviewers identify your request quickly.</p>
                </div>

              {/* Priority */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Flag className="w-4 h-4 text-red-600" /> Priority
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPriorityInfo((v) => !v)}
                    aria-expanded={showPriorityInfo}
                    aria-controls="priority-guidelines"
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
                    title="How to choose a priority"
                  >
                    <Info className="w-4 h-4" />
                    Info
                  </button>
                </div>
                <Select.Root value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                  <Select.Trigger
                    className="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    aria-label="Priority"
                  >
                    <Select.Value>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={
                            'h-2.5 w-2.5 rounded-full ' +
                            (priority === 'high'
                              ? 'bg-red-600'
                              : priority === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600')
                          }
                        />
                        <span className="capitalize">{priority}</span>
                      </span>
                    </Select.Value>
                    <Select.Icon>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className="z-[60] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                      position="popper"
                    >
                      <Select.Viewport className="p-1">
                        {(
                          [
                            { value: 'low', label: 'Low', dot: 'bg-emerald-600' },
                            { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
                            { value: 'high', label: 'High', dot: 'bg-red-600' },
                          ] as const
                        ).map((opt) => (
                          <Select.Item
                            key={opt.value}
                            value={opt.value}
                            className="group relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-800 outline-none data-[highlighted]:bg-gray-50"
                          >
                            <Select.ItemIndicator>
                              <Check className="w-4 h-4 text-red-600" />
                            </Select.ItemIndicator>
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${opt.dot}`} />
                              <Select.ItemText>{opt.label}</Select.ItemText>
                            </div>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                {showPriorityInfo && (
                  <motion.div
                    id="priority-guidelines"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute z-[70] left-0 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl p-4"
                    role="region"
                    aria-label="Priority guidelines"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">How to set priority</h4>
                      <button
                        type="button"
                        onClick={() => setShowPriorityInfo(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        aria-label="Close priority guidelines"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                        <div>
                          <span className="font-medium">High</span> — Activities with urgent deadlines (within 7 days), involving external guests or venue bookings, or dependent on critical approvals or resources.
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <div>
                          <span className="font-medium">Medium</span> — Activities scheduled within the month that require internal coordination and represent regular organizational or departmental events.

                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                        <div>
                          <span className="font-medium">Low</span> — Activities scheduled within the month that require internal coordination and represent regular organizational or departmental events.

                        </div>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus-visible:outline-none focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-700 leading-tight">
                    I confirm that I have reviewed all the details and they are correct
                  </span>
                </label>
              </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 rounded-b-2xl">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`px-6 py-2.5 text-sm font-medium text-white rounded-md transition-colors ${canConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Confirm & Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
