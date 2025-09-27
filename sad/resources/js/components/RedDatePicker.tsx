import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface RedDatePickerProps {
  value?: string; // ISO (yyyy-MM-dd)
  onChange: (value: string) => void;
  min?: string; // yyyy-MM-dd
  label?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  helperText?: string;
  error?: string;
}

// Utility to ensure date value is valid
const toDate = (v?: string) => {
  if (!v) return new Date();
  try { return parseISO(v); } catch { return new Date(); }
};

export default function RedDatePicker({ value, onChange, min, label, required, disabled, id, helperText, error }: RedDatePickerProps) {
  const selectedDate = value ? toDate(value) : undefined;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Build calendar grid
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const weeks: Date[][] = [];
  let day = startDate;
  while (day <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const isBeforeMin = (d: Date) => {
    if (!min) return false;
    try { return d < parseISO(min); } catch { return false; }
  };

  const handleSelect = (d: Date) => {
    if (disabled || isBeforeMin(d)) return;
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : '';

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left text-sm transition-all outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
          error ? 'border-red-300 bg-red-50' : selectedDate ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${!displayValue ? 'text-gray-400' : 'text-black'}`}>{displayValue || 'Select date'}</span>
        <CalendarIcon className="w-4 h-4 text-red-500 shrink-0" />
      </button>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">{error}</p>
      )}
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-semibold text-red-700 select-none">{format(viewDate, 'MMMM yyyy')}</div>
            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map(d => {
                  const isOther = !isSameMonth(d, monthStart);
                  const selected = selectedDate && isSameDay(d, selectedDate);
                  const disabledDay = isBeforeMin(d);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => handleSelect(d)}
                      disabled={disabledDay}
                      className={`h-9 rounded-lg text-sm font-medium relative transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 border ${
                        selected ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'border-transparent'
                      } ${
                        disabledDay ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-600 hover:text-white'
                      } ${isOther ? 'text-gray-500' : 'text-black'} ${selected ? '' : ''}`}
                    >
                      {format(d, 'd')}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); setViewDate(new Date()); setOpen(false); }}
              className="px-2 py-1 rounded-md text-red-600 hover:bg-red-100 font-medium"
            >Today</button>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="px-2 py-1 rounded-md text-gray-500 hover:bg-gray-100"
            >Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
