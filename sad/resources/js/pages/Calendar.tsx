import React, { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import DayTimeline from '@/components/DayTimeline';

// Day view is no longer a page view; it's shown in a modal from the month view

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  location?: string;
  color?: string; // tailwind color string e.g., 'bg-red-500'
  description?: string;
};

// Date helpers (lightweight, no external deps)
const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const addDays = (d: Date, n: number) => { const nd = new Date(d); nd.setDate(d.getDate() + n); return nd; };
const addWeeks = (d: Date, n: number) => addDays(d, n * 7);
const addMonths = (d: Date, n: number) => { const nd = new Date(d); nd.setMonth(d.getMonth() + n); return nd; };
const startOfWeek = (d: Date, weekStartsOn: 0 | 1 = 1) => {
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  return toStartOfDay(addDays(d, -diff));
};
const endOfWeek = (d: Date, weekStartsOn: 0 | 1 = 1) => addDays(startOfWeek(d, weekStartsOn), 6);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const isToday = (d: Date) => isSameDay(d, new Date());
const formatMonthYear = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const formatWeekRange = (d: Date) => {
  const s = startOfWeek(d);
  const e = endOfWeek(d);
  const sameMonth = s.getMonth() === e.getMonth();
  const startStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = e.toLocaleDateString('en-US', { month: sameMonth ? 'short' : 'short', day: 'numeric', year: s.getFullYear() === e.getFullYear() ? undefined : 'numeric' });
  return `${startStr} – ${endStr}`;
};
const formatDayLong = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const minutesSinceStartOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

const hours = Array.from({ length: 24 }, (_, i) => i);
const ROW_PX = 80; // px height per hour row for better spacing (larger cards)
const HOURS_COL_PX = 104; // width of the left hours column to match header
const TIME_OFFSET = 0; // no extra top offset; align events with hour lines
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// GMT label removed per design

// Generate month grid days (6 weeks view)
function useMonthGrid(baseDate: Date) {
  return useMemo(() => {
    const start = startOfWeek(startOfMonth(baseDate));
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  }, [baseDate]);
}

function eventsForDay(events: CalendarEvent[], day: Date) {
  // Only show events on their START date (no spanning across multiple days)
  return events.filter(ev => isSameDay(ev.start, day));
}

// Creation modal removed to keep calendar read-only

function toInputDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function toInputTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
function addHoursSafe(d: Date, h: number) { const nd = new Date(d); nd.setHours(d.getHours() + h); return nd; }

// Shared all-day detection helper
function isAllDayEvent(e: CalendarEvent): boolean {
  if (e.allDay) return true;
  const dur = e.end.getTime() - e.start.getTime();
  return e.start.getHours() === 0 && e.start.getMinutes() === 0 && dur >= 24 * 60 * 60 * 1000;
}

// Month view component (no internal header; parent renders shared controls)
const MonthView: React.FC<{
  date: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onOpenDay: (day: Date) => void;
  onSelectDay: (day: Date) => void;
}> = ({ date, events, selectedDate, onOpenDay, onSelectDay }) => {
  const days = useMonthGrid(date);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7)), [days]);

  // Solid accent background for the left bar of the month pills
  const accentBg = (color?: string) => {
    if (!color) return 'bg-red-500';
    if (color.includes('blue')) return 'bg-blue-500';
    if (color.includes('green')) return 'bg-green-500';
    if (color.includes('purple')) return 'bg-purple-500';
    if (color.includes('yellow')) return 'bg-yellow-500';
    if (color.includes('orange')) return 'bg-orange-500';
    if (color.includes('pink')) return 'bg-pink-500';
    if (color.includes('red')) return 'bg-red-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col">
      {/* Day labels */}
      <div className="grid grid-cols-7 text-xs sm:text-sm text-gray-500 pb-2">
        {dayNames.map((d) => (
          <div key={d} className="px-2 py-1 text-center sm:text-left">{d}</div>
        ))}
      </div>

  {/* Grid as spaced cards */}
  <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((day) => {
              const dayEvents = eventsForDay(events, day);
              const outside = !isSameMonth(day, date);
              const today = isToday(day);
              const selected = isSameDay(day, selectedDate);
              return (
                <div
                  key={day.toISOString()}
                  className={`group/day h-28 sm:h-32 md:h-36 rounded-2xl p-2 sm:p-2.5 flex flex-col transition-colors ${outside ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50/60'} ${today ? 'border border-transparent ring-2 ring-blue-300 ring-offset-1 ring-offset-white bg-blue-50' : 'border border-gray-200'}`}
                  onClick={(e) => {
                    onSelectDay(day);
                    onOpenDay(day);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDay(day);
                      onOpenDay(day);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div
                      data-role="date-number"
                      className={`inline-flex items-center justify-center w-6 h-6 text-xs sm:text-sm font-semibold rounded-full ${today ? 'bg-blue-600 text-white' : selected ? 'bg-red-600 text-white' : outside ? 'text-gray-400' : 'text-black'} transition-colors`}
                      title={day.toDateString()}
                    >
                      {day.getDate()}
                    </div>
                    {dayEvents.length > 2 && (() => {
                      const hiddenCount = dayEvents.length - 2;
                      const dots = Math.min(hiddenCount, 3);
                      return (
                        <div className="flex items-center gap-0.5 pr-0.5" aria-label={`${hiddenCount} more events`} title={`${hiddenCount} more events`}>
                          {Array.from({ length: dots }).map((_, i) => {
                            const colorClass = accentBg(dayEvents[2 + i]?.color);
                            return (
                              <span key={i} className={`inline-block rounded-full ${colorClass} w-1 h-1`} />
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`group/event relative flex flex-col w-full rounded-md pl-2 pr-2 py-1 text-[11px] sm:text-[12px] ${ev.color ?? 'bg-red-50'} text-gray-900 font-medium cursor-default shadow-sm hover:shadow-sm transition-shadow`}
                      >
                        {/* Accent bar for clearer color semantics */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${accentBg(ev.color)}`} />
                        <div className="font-medium leading-snug truncate">{ev.title}</div>
                        <div className="text-[10px] sm:text-[11px] text-gray-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(ev.start)}
                        </div>
                        {/* Custom tooltip */}
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 -translate-x-1/2 mt-2 opacity-0 group-hover/event:opacity-100 group-hover/event:translate-y-0 translate-y-1 transition-all duration-150 ease-out">
                          <div className="relative w-max max-w-xs rounded-xl bg-gray-900/95 backdrop-blur px-4 py-3 text-xs text-white shadow-2xl ring-1 ring-white/10">
                            <div className="font-semibold mb-1 leading-tight">{ev.title}</div>
                            <div className="flex items-center gap-1.5 text-gray-200 leading-tight">
                              <Clock className="w-3 h-3" />
                              {formatTimeRange(ev.start, ev.end)}
                            </div>
                            <div className="text-gray-300 mt-1 leading-tight">
                              {formatDateRange(ev.start, ev.end)}
                            </div>
                            {/* Arrow */}
                            <div className="absolute left-1/2 -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-gray-900/95 ring-1 ring-white/10" />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Week/Day time grid event placement (simple stacking with small horizontal offset)
function useTimedEvents(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date) {
  return useMemo(() => {
    const timed = events.filter(e => e.end > rangeStart && e.start < rangeEnd && !isAllDayEvent(e));
    // Sort by start time
    timed.sort((a, b) => a.start.getTime() - b.start.getTime());
    return timed;
  }, [events, rangeStart.getTime(), rangeEnd.getTime()]);
}

const TimeGrid: React.FC<{
  startDate: Date; // inclusive
  endDate: Date;   // exclusive
  days: Date[];    // each day column label
  events: CalendarEvent[];
  onNewEventAt?: (dt: Date) => void;
  highlightTodayBgClass?: string;
}> = ({ startDate, endDate, days, events, onNewEventAt, highlightTodayBgClass }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nowTop, setNowTop] = useState<number | null>(null);
  const timedEvents = useTimedEvents(events, startDate, endDate);
  const COL_GAP = 4; // px gap between overlapping columns
  const MIN_EVENT_PX = 12; // minimal height to keep very short events visible

  useEffect(() => {
    const update = () => {
      const n = new Date();
      if (n >= startDate && n < endDate) {
        const mins = minutesSinceStartOfDay(n);
        setNowTop((mins / 60) * ROW_PX);
      } else {
        setNowTop(null);
      }
    };
    update();
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, [startDate.getTime(), endDate.getTime()]);

  const onGridDoubleClick = (e: React.MouseEvent, day: Date) => {
    const target = containerRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top - TIME_OFFSET;
    const hourFloat = Math.max(0, Math.min(23.9, y / ROW_PX));
    const minutes = Math.round(hourFloat * 60);
    const dt = new Date(day);
    dt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    if (onNewEventAt) onNewEventAt(dt);
  };

  const edgeBorder = (color?: string) => {
    if (!color) return 'border-red-200';
    if (color.includes('blue')) return 'border-blue-200';
    if (color.includes('green')) return 'border-green-200';
    if (color.includes('purple')) return 'border-purple-200';
    if (color.includes('yellow')) return 'border-yellow-200';
    if (color.includes('orange')) return 'border-orange-200';
    if (color.includes('pink')) return 'border-pink-200';
    return 'border-red-200';
  };

  // Solid accent background for the left bar of the event card
  const accentBg = (color?: string) => {
    if (!color) return 'bg-red-500';
    if (color.includes('blue')) return 'bg-blue-500';
    if (color.includes('green')) return 'bg-green-500';
    if (color.includes('purple')) return 'bg-purple-500';
    if (color.includes('yellow')) return 'bg-yellow-500';
    if (color.includes('orange')) return 'bg-orange-500';
    if (color.includes('pink')) return 'bg-pink-500';
    if (color.includes('red')) return 'bg-red-500';
    return 'bg-red-500';
  };

  // Compute non-overlapping layout for a day's timed events
  type LaidOut = {
    ev: CalendarEvent;
    top: number;
    height: number;
    left: string;  // CSS calc for % + px
    width: string; // CSS calc for % - px
    z: number;
  };
  function layoutTimedDayEvents(list: CalendarEvent[], dayStart: Date, dayEnd: Date): LaidOut[] {
    if (list.length === 0) return [];
    // Clip to day boundaries so multi-day events render correctly within each day
    const clipped = list
      .map(ev => ({ ev, s: ev.start < dayStart ? dayStart : ev.start, e: ev.end > dayEnd ? dayEnd : ev.end }))
      .filter(x => x.e > x.s);
    if (clipped.length === 0) return [];

    // Sort by clipped start asc, then by longer duration first
    const sorted = [...clipped].sort((a, b) => a.s.getTime() - b.s.getTime() || (b.e.getTime() - b.s.getTime()) - (a.e.getTime() - a.s.getTime()));
    const clusters: typeof clipped[] = [];
    let cluster: typeof clipped = [] as any;
    let clusterEnd = -Infinity;
    for (const item of sorted) {
      if (cluster.length === 0 || item.s.getTime() < clusterEnd) {
        cluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.e.getTime());
      } else {
        clusters.push(cluster);
        cluster = [item];
        clusterEnd = item.e.getTime();
      }
    }
    if (cluster.length) clusters.push(cluster);

    const laid: LaidOut[] = [];
    for (const group of clusters) {
      // Assign columns greedily based on clipped end times
      const colEnds: number[] = [];
      const colOf = new Map<typeof group[number], number>();
      for (const item of group) {
        let placed = false;
        for (let c = 0; c < colEnds.length; c++) {
          if (item.s.getTime() >= colEnds[c]) {
            colEnds[c] = item.e.getTime();
            colOf.set(item, c);
            placed = true;
            break;
          }
        }
        if (!placed) {
          colEnds.push(item.e.getTime());
          colOf.set(item, colEnds.length - 1);
        }
      }
      const cols = colEnds.length;
      for (const item of group) {
        const c = colOf.get(item)!;
        const startMin = minutesSinceStartOfDay(item.s);
        const endMin = minutesSinceStartOfDay(item.e);
        const top = TIME_OFFSET + (startMin / 60) * ROW_PX;
        const height = Math.max(MIN_EVENT_PX, ((endMin - startMin) / 60) * ROW_PX);
        const leftPct = (100 / cols) * c;
        const widthPct = 100 / cols;
        const left = `calc(${leftPct}% + ${c * COL_GAP}px)`;
        const width = `calc(${widthPct}% - ${(cols - 1) * COL_GAP}px)`;
        laid.push({ ev: item.ev, top, height, left, width, z: 10 + c });
      }
    }
    return laid;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
      <div ref={containerRef} className="relative grid grid-cols-[var(--hours-col)_repeat(var(--cols),1fr)]" style={{ ['--cols' as any]: String(days.length), ['--hours-col' as any]: `${HOURS_COL_PX}px` }}>
        {/* Full-width hour separators aligned with labels */}
        <div className="pointer-events-none absolute inset-0 -left-1">
          {hours.map((h) => (
            <div key={`sep-${h}`} className="absolute left-0 right-0" style={{ top: TIME_OFFSET + h * ROW_PX }}>
              <div className="h-px bg-gray-100" />
            </div>
          ))}
        </div>
        {/* Hour labels */}
        <div className="select-none border-r border-gray-200">
          {hours.map(h => (
            <div key={h} className="relative text-[12px] sm:text-sm pr-6 text-right text-gray-600 flex items-center justify-end font-medium" style={{ height: ROW_PX }}>
              {formatHour(h)}
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map((day) => (
          <div key={day.toDateString()} className={`relative border-l border-gray-200`} onDoubleClick={(e) => onGridDoubleClick(e, day)}>
            {/* Hour lines */}
            {hours.map(h => (
              <div key={h} className="relative" style={{ height: ROW_PX }}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-gray-100" />
              </div>
            ))}
            {/* Events for this day */}
            {(() => {
              const dayStart = toStartOfDay(day);
              const dayEnd = addDays(dayStart, 1);
              // Only render each event once in the week: on its first visible day.
              // Rule:
              //  - If the event starts within this week, render on its start date only.
              //  - If the event started before this week but overlaps, render only on the week's first day.
              const list = timedEvents.filter((ev) => {
                const startsThisDay = isSameDay(ev.start, day);
                const startedBeforeWeek = ev.start < startDate;
                const isWeekFirstDay = isSameDay(day, startDate);
                return startsThisDay || (startedBeforeWeek && isWeekFirstDay);
              });
              const laid = layoutTimedDayEvents(list, dayStart, dayEnd);
              return laid.map((l) => (
                <div key={l.ev.id} className={`absolute rounded-xl bg-white/95 ring-1 ring-gray-200 shadow-md`}
                  style={{ top: l.top, height: l.height, left: l.left, width: l.width, zIndex: l.z }}>
                  {/* Accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${accentBg(l.ev.color)}`} />
                  <div className="pl-3.5 pr-3.5 py-2.5 h-full flex flex-col justify-center gap-1.5">
                    <div className="text-[13px] font-semibold text-gray-900 leading-tight truncate" title={l.ev.title}>{l.ev.title}</div>
                    <div className="text-[12px] text-gray-600 leading-tight flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeRange(l.ev.start, l.ev.end)}</div>
                    {l.ev.location && <div className="text-[11px] text-gray-600 leading-tight flex items-center gap-1"><MapPin className="w-3 h-3" />{l.ev.location}</div>}
                  </div>
                </div>
              ));
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};

// All-day row removed per requirement

// DayTimeline now imported from components

function formatHour(h: number) {
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ampm}`;
}
function formatTimeRange(s: Date, e: Date) {
  const f = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${f(s)} – ${f(e)}`;
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatDateRange(s: Date, e: Date) {
  const sameDay = isSameDay(s, e);
  if (sameDay) {
    return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const startStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = e.toLocaleDateString('en-US', { month: sameMonth ? 'short' : 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

// Parse events from server format to CalendarEvent format
function parseServerEvents(serverEvents: any[]): CalendarEvent[] {
  if (!serverEvents || serverEvents.length === 0) {
    return [];
  }
  
  return serverEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: new Date(ev.start),
    end: new Date(ev.end),
    allDay: ev.allDay || false,
    location: ev.location || undefined,
    color: ev.color || 'bg-red-50',
    description: ev.description || undefined,
  }));
}

export default function Calendar() {
  const { initialEvents } = usePage<{ initialEvents: any[] }>().props;
  
  const [current, setCurrent] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => 
    parseServerEvents(initialEvents || [])
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);

  // Prevent page scroll when modal is open; allow only modal content to scroll
  useEffect(() => {
    if (!dayModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Avoid layout shift when removing scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [dayModalOpen]);

 
  const goPrev = () => setCurrent((d) => addMonths(d, -1));
  const goNext = () => setCurrent((d) => addMonths(d, 1));

  // read-only: no creation handlers

  // Derived for week/day
  // Week view removed per requirement
  // Day title only used within the modal

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 font-poppins text-black">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-red-600">Calendar</h1>
          <p className="mt-1 text-sm text-gray-600">Browse campus-wide events</p>
        </div>

        {/* Unified command center */}
        <div className="mb-4 rounded-xl border border-gray-300 bg-white/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="p-3 sm:p-4 flex items-center justify-center gap-3">
            {/* Navigation cluster */}
            <div className="flex items-center gap-2">
              <button aria-label="Previous" onClick={goPrev} className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition focus:outline-none focus:ring-0"><ChevronLeft className="w-4 h-4" /></button>
              <div className="min-w-[160px] text-center text-lg font-semibold text-gray-900">{formatMonthYear(current)}</div>
              <button aria-label="Next" onClick={goNext} className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition focus:outline-none focus:ring-0"><ChevronRight className="w-4 h-4" /></button>
            </div>
            {/* Day view switch removed; month-only */}
          </div>
        </div>

        {/* View containers */}
        <AnimatePresence mode="wait">
          <motion.div key="month" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <MonthView
              date={current}
              events={events}
              selectedDate={selectedDate}
              onOpenDay={(d) => { setDayModalDate(d); setDayModalOpen(true); }}
              onSelectDay={(d) => setSelectedDate(d)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Event modal removed */}

        {/* Day modal overlay */}
        <AnimatePresence>
          {dayModalOpen && dayModalDate && (
            <motion.div
              key="day-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setDayModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative z-10 w-[95vw] max-w-3xl max-h-[90vh] overflow-auto"
              >
                <div className="absolute -top-10 right-0 flex items-center gap-2">
                  <button
                    onClick={() => setDayModalOpen(false)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/90 backdrop-blur border shadow-sm text-gray-700 hover:bg-white"
                  >
                    <X className="w-4 h-4" /> Close
                  </button>
                </div>
                <DayTimeline date={dayModalDate} events={events} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
