import MainLayout from '@/layouts/mainlayout';
import { motion } from 'framer-motion';
import { Calendar, Megaphone } from 'lucide-react';
import { LinkifiedText } from '@/utils/linkify';
import { useState } from 'react';
import { formatDateTime } from '@/lib/utils';

interface Event {
  title: string;
  date?: string; // legacy
  description: string;
  created_by: 'student' | 'admin_assistant' | 'dean';
  created_at?: string;
}

interface Announcement {
  title: string;
  date?: string; // legacy
  description: string;
  created_by: 'admin_assistant' | 'dean' | 'student';
  created_at?: string;
}

interface DeanDashboardProps {
  events?: Event[];
  announcements?: Announcement[];
}

// Calendar UI Component (same as above)
function DashboardCalendar() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  function prevMonthHandler() {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }
  function nextMonthHandler() {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  return (
    <div
      className="rounded-2xl bg-white shadow-md p-6 mx-auto"
      style={{
        width: '370px',
        minWidth: '370px',
        maxWidth: '370px',
        height: '560px',
        minHeight: '560px',
        maxHeight: '560px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonthHandler}
          className="text-gray-400 hover:text-red-500 transition text-2xl"
          aria-label="Previous Month"
        >
          &#8592;
        </button>
        <div className="font-bold text-xl text-gray-900">
          {monthNames[month]} <span className="font-normal text-gray-400">{year}</span>
        </div>
        <button
          onClick={nextMonthHandler}
          className="text-gray-400 hover:text-red-500 transition text-2xl"
          aria-label="Next Month"
        >
          &#8594;
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-base font-semibold text-gray-700 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center gap-y-2 flex-1">
        {days.map((d, idx) => {
          const isToday =
            d === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          return (
            <div
              key={idx}
              className={`h-10 w-10 flex items-center justify-center rounded-full
                ${isToday ? 'bg-red-100 text-red-600 font-bold shadow' : d ? 'text-gray-800' : 'text-gray-300'}
                ${d ? 'cursor-pointer hover:bg-red-50 transition' : ''}
                ${d === today.getDate() && isToday ? 'ring-2 ring-red-300' : ''}
                text-base
              `}
            >
              {d ? d : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DeanDashboard({ events = [], announcements = [] }: DeanDashboardProps) {
  // Backend provides limited, ordered lists already
  const filteredAnnouncements = announcements;

  return (
    <MainLayout>
      <div className="p-4 space-y-8 font-poppins">
        {/* Animated Header Image */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden shadow"
        >
          <div className="relative">
            <img
              src="/images/uic-bg.png"
              alt="UIC Building"
              className="w-full h-72 object-cover"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center px-4 space-y-2"
            >
              <img
                src="/images/uic-logo.png"
                alt="UIC Logo"
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
              <h1 className="text-3xl md:text-5xl font-bold text-white text-center drop-shadow">
                University of the Immaculate Conception
              </h1>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content: Left (Events+Announcements), Right (Calendar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Events + Announcements */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Events */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Events
                </h2>
                <a href="/events" className="text-sm text-red-500 hover:underline">
                  View All
                </a>
              </div>
              <div className="space-y-3 text-sm">
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-3 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      onClick={() => (window.location.href = '/events')}
                    >
                      <div className="font-semibold text-black flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" /> {event.title}
                      </div>
                      <div className="text-gray-500 text-xs">{event.created_at ? formatDateTime(event.created_at) : '—'}</div>
                      <div className="text-black"><LinkifiedText text={event.description} /></div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No events available.</p>
                )}
              </div>
            </motion.div>

            {/* Announcements */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <Megaphone className="w-5 h-5" /> Announcements
                </h2>
                <a href="/announcements" className="text-sm text-red-500 hover:underline">
                  View All
                </a>
              </div>
              <div className="space-y-4 text-sm">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((a, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-3 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      onClick={() => (window.location.href = '/announcements')}
                    >
                      <div className="font-bold text-black flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-red-500" /> {a.title}
                      </div>
                      <div className="text-gray-500 text-xs">{a.created_at ? formatDateTime(a.created_at) : '—'}</div>
                      <p className="text-black"><LinkifiedText text={a.description} /></p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No announcements available.</p>
                )}
              </div>
            </motion.div>
          </div>
          {/* Right Column: Calendar */}
          <div>
            <DashboardCalendar />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
