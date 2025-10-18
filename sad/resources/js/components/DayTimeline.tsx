import React, { useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';

// Minimal event shape required by the Day timeline
export type DayEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  color?: string; // e.g., 'bg-red-50'
  description?: string;
};

// Local helpers (kept minimal and self-contained)
const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const addDays = (d: Date, n: number) => { const nd = new Date(d); nd.setDate(d.getDate() + n); return nd; };
const formatDayLong = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export default function DayTimeline({ date, events }: { date: Date; events: DayEvent[] }) {
  const dayStart = toStartOfDay(date);
  const dayEnd = addDays(dayStart, 1);
  const timed = useMemo(
    () =>
      events
        .filter((e) => e.end > dayStart && e.start < dayEnd)
        .map((e) => ({
          ...e,
          _s: e.start < dayStart ? dayStart : e.start,
          _e: e.end > dayEnd ? dayEnd : e.end,
        }))
        .sort((a, b) => a._s.getTime() - b._s.getTime()),
    [events, dayStart.getTime(), dayEnd.getTime()]
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof timed>();
    for (const e of timed) {
      const label = e._s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const arr = map.get(label) ?? [];
      arr.push(e);
      map.set(label, arr);
    }
    return Array.from(map.entries());
  }, [timed]);

  const formatRange = (s: Date, e: Date) =>
    `${s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${e.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;

  const accentBorder = (color?: string) => {
    if (!color) return 'border-l-4 border-red-300';
    if (color.includes('blue')) return 'border-l-4 border-blue-300';
    if (color.includes('green')) return 'border-l-4 border-green-300';
    if (color.includes('purple')) return 'border-l-4 border-purple-300';
    if (color.includes('yellow')) return 'border-l-4 border-yellow-300';
    if (color.includes('orange')) return 'border-l-4 border-orange-300';
    if (color.includes('pink')) return 'border-l-4 border-pink-300';
    return 'border-l-4 border-red-300';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700">Day Timeline</div>
        <div className="text-base sm:text-lg font-semibold text-gray-900">{formatDayLong(date)}</div>
      </div>
      <div className="p-4 sm:p-6">
        {groups.length === 0 && (
          <div className="text-sm text-gray-600">No events scheduled for this day.</div>
        )}
        {groups.map(([label, list]) => (
          <div key={label} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xs sm:text-sm text-gray-500 w-24">{label}</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid gap-3">
              {list.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-xl ${ev.color ?? 'bg-red-50'} border border-gray-200 ${accentBorder(ev.color)} px-4 py-3 shadow-sm`}
                >
                  <div className="text-sm font-semibold text-gray-900">{ev.title}</div>
                  {ev.description && (
                    <div className="text-xs text-gray-600 mt-1">{ev.description}</div>
                  )}
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatRange(ev._s, ev._e)}</span>
                    {ev.location && (
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
