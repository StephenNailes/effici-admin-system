import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';

interface RequestFilterDropdownProps {
  status: string; // '' means all
  priority: string; // '' means all
  requestType: string; // '' means all
  onChangeStatus: (val: string) => void;
  onChangePriority: (val: string) => void;
  onChangeRequestType: (val: string) => void;
  showStatus?: boolean; // if false, only show priority section
  showRequestType?: boolean; // if false, hide request type section
  className?: string;
}

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Under Revision', value: 'revision_requested' },
];

const priorityOptions = [
  { label: 'All Priorities', value: '' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const requestTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Activity Plan', value: 'activity_plan' },
  { label: 'Budget Request', value: 'budget_request' },
];

export const RequestFilterDropdown: React.FC<RequestFilterDropdownProps> = ({
  status,
  priority,
  requestType,
  onChangeStatus,
  onChangePriority,
  onChangeRequestType,
  showStatus = true,
  showRequestType = true,
  className
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activeFilterCount = [status, priority, requestType].filter(f => f !== '').length;

  return (
    <div className={className} ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05, boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg shadow font-semibold transition-colors border text-sm ${
          open 
            ? 'bg-red-600 border-red-600 text-white' 
            : activeFilterCount > 0
            ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
            : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
        }`}
      >
        <Filter className="w-5 h-5" />
        <span>Filter</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-4 sm:right-6 mt-2 w-72 bg-white border border-red-200 rounded-lg shadow-xl z-30 overflow-hidden"
          >
            <ul className="py-1 text-sm max-h-[480px] overflow-auto">
              {showRequestType && (
                <>
                  <li className="px-3 pt-2 pb-1 text-[10px] tracking-wider font-semibold text-red-600 uppercase flex items-center justify-between">
                    <span>Request Type</span>
                    {requestType && (
                      <button
                        type="button"
                        onClick={() => onChangeRequestType('')}
                        className="text-xs text-gray-500 hover:text-red-600 font-normal normal-case"
                      >
                        Clear
                      </button>
                    )}
                  </li>
                  {requestTypeOptions.map(opt => {
                    const active = requestType === opt.value;
                    return (
                      <button
                        key={opt.value + opt.label}
                        type="button"
                        onClick={() => onChangeRequestType(opt.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${active ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700 hover:bg-red-50 hover:text-red-700'}`}
                      >
                        <span>{opt.label}</span>
                        {active && <span className="w-2 h-2 rounded-full bg-red-600" />}
                      </button>
                    );
                  })}
                  <div className="my-1 h-px bg-gray-100" />
                </>
              )}
              {showStatus && (
                <>
                  <li className="px-3 pt-2 pb-1 text-[10px] tracking-wider font-semibold text-red-600 uppercase flex items-center justify-between">
                    <span>Status</span>
                    {status && (
                      <button
                        type="button"
                        onClick={() => onChangeStatus('')}
                        className="text-xs text-gray-500 hover:text-red-600 font-normal normal-case"
                      >
                        Clear
                      </button>
                    )}
                  </li>
                  {statusOptions.map(opt => {
                    const active = status === opt.value;
                    return (
                      <button
                        key={opt.value + opt.label}
                        type="button"
                        onClick={() => onChangeStatus(opt.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${active ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700 hover:bg-red-50 hover:text-red-700'}`}
                      >
                        <span>{opt.label}</span>
                        {active && <span className="w-2 h-2 rounded-full bg-red-600" />}
                      </button>
                    );
                  })}
                  <div className="my-1 h-px bg-gray-100" />
                </>
              )}
              <li className="px-3 pt-2 pb-1 text-[10px] tracking-wider font-semibold text-red-600 uppercase flex items-center justify-between">
                <span>Priority</span>
                {priority && (
                  <button
                    type="button"
                    onClick={() => onChangePriority('')}
                    className="text-xs text-gray-500 hover:text-red-600 font-normal normal-case"
                  >
                    Clear
                  </button>
                )}
              </li>
              {priorityOptions.map(opt => {
                const active = priority === opt.value;
                return (
                  <button
                    key={opt.value + opt.label}
                    type="button"
                    onClick={() => onChangePriority(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${active ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700 hover:bg-red-50 hover:text-red-700'}`}
                  >
                    <span>{opt.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-red-600" />}
                  </button>
                );
              })}
            </ul>
            <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 flex gap-2">
              <button
                type="button"
                onClick={() => { onChangeStatus(''); onChangePriority(''); onChangeRequestType(''); }}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
              >Reset All</button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 shadow transition-colors"
              >Apply</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestFilterDropdown;
