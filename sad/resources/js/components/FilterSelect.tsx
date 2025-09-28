import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  colorClass?: string; // Tailwind color classes applied to badge background/text
  icon?: React.ReactNode;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  allowAll?: boolean; // If true prepends an 'All' option (empty value)
  className?: string;
  showBadgeColors?: boolean;
}

// Keyboard navigation helpers
const KEY_CODES = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESC: 'Escape',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  HOME: 'Home',
  END: 'End',
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -4, pointerEvents: 'none' as const },
  visible: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
  exit: { opacity: 0, y: -4, pointerEvents: 'none' as const },
};

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  allowAll = true,
  className = '',
  showBadgeColors = true,
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const computedOptions = allowAll
    ? [{ value: '', label: 'All', colorClass: 'bg-gray-100 text-gray-600' }, ...options]
    : options;

  const selected = computedOptions.find((o) => o.value === value);

  // Outside click handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const commitChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setOpen(false);
      setActiveIndex(-1);
      // Return focus to button for accessibility
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if ([KEY_CODES.ENTER, KEY_CODES.SPACE, KEY_CODES.ARROW_DOWN].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        // Set active to selected or first item
        const idx = Math.max(
          0,
          computedOptions.findIndex((o) => o.value === value)
        );
        setActiveIndex(idx === -1 ? 0 : idx);
      }
      return;
    }

    switch (e.key) {
      case KEY_CODES.ESC:
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        buttonRef.current?.focus();
        break;
      case KEY_CODES.ARROW_DOWN:
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1 >= computedOptions.length ? 0 : prev + 1;
            scrollOptionIntoView(next);
          return next;
        });
        break;
      case KEY_CODES.ARROW_UP:
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1 < 0 ? computedOptions.length - 1 : prev - 1;
          scrollOptionIntoView(next);
          return next;
        });
        break;
      case KEY_CODES.HOME:
        e.preventDefault();
        setActiveIndex(0);
        scrollOptionIntoView(0);
        break;
      case KEY_CODES.END:
        e.preventDefault();
        setActiveIndex(computedOptions.length - 1);
        scrollOptionIntoView(computedOptions.length - 1);
        break;
      case KEY_CODES.ENTER:
      case KEY_CODES.SPACE:
        e.preventDefault();
        if (activeIndex >= 0) commitChange(computedOptions[activeIndex].value);
        break;
    }
  };

  const scrollOptionIntoView = (idx: number) => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelectorAll('[data-option]')[idx] as HTMLElement | undefined;
    if (el) {
      const { offsetTop, offsetHeight } = el;
      const viewTop = list.scrollTop;
      const viewBottom = viewTop + list.clientHeight;
      if (offsetTop < viewTop) list.scrollTop = offsetTop;
      else if (offsetTop + offsetHeight > viewBottom)
        list.scrollTop = offsetTop - list.clientHeight + offsetHeight;
    }
  };

  return (
  <div className={`relative flex flex-col gap-1 ${className}`} ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div>
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          className={`w-56 md:w-64 flex items-center justify-between gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-left text-sm font-medium shadow-sm transition focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-300 ${
            open ? 'ring-2 ring-red-300 border-red-400' : ''
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                {showBadgeColors ? (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                      selected.colorClass || 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selected.label}
                  </span>
                ) : (
                  <span className="truncate">{selected.label}</span>
                )}
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            className="absolute left-0 top-full mt-2 max-h-56 w-56 md:w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg focus:outline-none z-20"
          >
            {computedOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;
              return (
                <li
                  key={opt.value + idx}
                  role="option"
                  aria-selected={isSelected}
                  data-option
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    // Prevent button blur before click registers
                    e.preventDefault();
                  }}
                  onClick={() => commitChange(opt.value)}
                  className={`group relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition select-none ${
                    isActive ? 'bg-red-50' : ''
                  } ${isSelected ? 'font-semibold text-red-600' : 'text-gray-700'}`}
                >
                  {showBadgeColors ? (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        opt.colorClass || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </span>
                  ) : (
                    <span className="truncate">{opt.label}</span>
                  )}
                  {isSelected && (
                    <Check className="ml-auto h-4 w-4 text-red-500" />
                  )}
                </li>
              );
            })}
            {value && (
              <li
                role="option"
                aria-selected={false}
                data-option
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitChange('')}
                className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterSelect;
