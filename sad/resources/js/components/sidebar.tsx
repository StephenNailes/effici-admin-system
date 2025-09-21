import {
  FaHome,
  FaFileAlt,
  FaChartLine,
  FaLock,
  FaBook,
  FaEdit,
  FaSignOutAlt,
  FaUser,
  FaChevronDown,
  FaClipboardList, // Add for Activity Plan
  FaToolbox,       // Add for Borrow Equipment
  FaChartBar,      // Add for Analytics Dashboard
  FaBell,          // Add for Notifications
} from 'react-icons/fa';
import { usePage, Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import { ReactElement, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from '@/components/NotificationPanel';

type UserRole = 'student' | 'admin_assistant' | 'dean';

interface MenuItem {
  name: string;
  href?: string;
  icon: ReactElement;
  children?: { name: string; href: string; icon?: ReactElement }[];
}

export default function Sidebar() {
  const { auth, url } = usePage().props as any;
  const role = (auth?.user?.role ?? 'student') as UserRole;
  const user = auth?.user ?? { first_name: 'Guest', role: 'student' };
  const currentPath = url ?? '';

  // Helper function to get correct profile picture URL
  const getProfilePictureUrl = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    
    // If it already starts with /storage/, use as is
    if (profilePicture.startsWith('/storage/')) {
      return profilePicture;
    }
    
    // Otherwise, add /storage/ prefix
    return `/storage/${profilePicture}`;
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // Store requestOpen state in localStorage to persist across navigation
  const [requestOpen, setRequestOpen] = useState(() => {
    const stored = localStorage.getItem('requestOpen');
    return stored ? JSON.parse(stored) : false;
  });
  // Track if user toggled the dropdown (for animation)
  const [requestToggled, setRequestToggled] = useState(false);

  const dropdownRef = useRef(null);

  // Update localStorage when requestOpen changes
  useEffect(() => {
    localStorage.setItem('requestOpen', JSON.stringify(requestOpen));
  }, [requestOpen]);

  const handleLogout = () => {
    setShowConfirm(false);
    Inertia.post('/logout');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setDropdownOpen(false);
      }
      
      // Handle notification panel click outside
      const notificationPanel = document.querySelector('[data-external-notification-panel]');
      if (notificationPanelOpen && notificationPanel && !notificationPanel.contains(event.target as Node)) {
        setNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationPanelOpen]);

  // ✅ Menu Items (use Laravel route() helper to match backend routes)
  const menuItems: Record<UserRole, MenuItem[]> = {
    student: [
      { name: 'Home', href: route('student.dashboard'), icon: <FaHome /> },
      {
        name: 'Request Forms',
        icon: <FaFileAlt />,
        children: [
          { name: 'Activity Plan', href: route('student.requests.activity-plan'), icon: <FaClipboardList /> }, // 👈 Added icon
          { name: 'Borrow Equipment', href: route('student.borrow-equipment'), icon: <FaToolbox /> }, // 👈 Added icon
          // 🔜 Add more requests here (e.g. Room Reservation, etc.)
        ],
      },
      { name: 'Activity Log', href: route('activity-log.index'), icon: <FaChartLine /> },
      { name: 'Revise Requests', href: route('student.revision'), icon: <FaBook /> },
    ],
    admin_assistant: [
      { name: 'Home', href: route('admin.dashboard'), icon: <FaHome /> },
      { name: 'Requests', href: route('admin.requests'), icon: <FaFileAlt /> },
      { name: 'Equipment Management', href: route('admin.equipment-management'), icon: <FaToolbox /> },
      { name: 'Activity History', href: route('admin.activity-history'), icon: <FaChartLine /> },
    ],
    dean: [
      { name: 'Home', href: route('dean.dashboard'), icon: <FaHome /> },
      { name: 'Requests', href: route('dean.requests'), icon: <FaFileAlt /> },
      { name: 'Analytics', href: route('dean.analytics'), icon: <FaChartBar /> },
      { name: 'Activity History', href: route('dean.activity-history'), icon: <FaChartLine /> },
    ],
  };

  return (
    <>
      <aside
        className="w-64 h-screen text-white flex flex-col justify-between shadow-2xl font-[Poppins] overflow-hidden fixed left-0 top-0 transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, #e6232a 0%, #c91c24 40%, #a11d1d 70%, #6b1616 100%)'
        }}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-center gap-3 px-6 py-7">
            <img src="/images/logo.png" alt="EfficiAdmin Logo" className="w-8 h-8 object-contain drop-shadow-lg" />
            <span className="text-2xl font-extrabold tracking-wide leading-none">EfficiAdmin</span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col px-4 pt-8 space-y-8">
            {menuItems[role]?.map((item) => (
              <div key={item.name}>
                {/* If has children → dropdown */}
                {item.children ? (
                  <>
                    <button
                      onClick={() => {
                        setRequestOpen((prev: boolean) => !prev);
                        setRequestToggled(true); // Only animate after user toggles
                      }}
                      className={`flex items-center justify-between w-full gap-3 px-5 py-3 rounded-lg transition-all duration-200 ease-in-out font-medium
                        ${item.children.some((c) => c.href === currentPath)
                          ? 'bg-white/30 text-white shadow-lg border-l-4 border-white scale-[1.05] font-bold'
                          : 'hover:bg-white/20 hover:scale-[1.03] hover:shadow-md'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-base">{item.name}</span>
                      </div>
                      <FaChevronDown
                        className={`transition-transform ${requestOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Only animate if user toggled, otherwise just show/hide instantly */}
                    {requestToggled ? (
                      <AnimatePresence>
                        {requestOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-8 mt-2 flex flex-col gap-2"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                preserveState={false}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm transition
                                  ${currentPath === child.href
                                    ? 'bg-white/30 text-white font-bold shadow-md'
                                    : 'hover:bg-white/20'}
                                `}
                              >
                                {/* 👇 Add icon if present */}
                                {child.icon && <span className="text-base mr-2">{child.icon}</span>}
                                {child.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ) : (
                      requestOpen && (
                        <div className="ml-8 mt-2 flex flex-col gap-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              preserveState={false}
                              className={`flex items-center px-4 py-2 rounded-lg text-sm transition
                                ${currentPath === child.href
                                  ? 'bg-white/30 text-white font-bold shadow-md'
                                  : 'hover:bg-white/20'}
                              `}
                            >
                              {/* 👇 Add icon if present */}
                              {child.icon && <span className="text-base mr-2">{child.icon}</span>}
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    preserveState={false}
                    className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-200 ease-in-out font-medium
                      ${currentPath === item.href
                        ? 'bg-white/30 text-white shadow-lg border-l-4 border-white scale-[1.05] font-bold'
                        : 'hover:bg-white/20 hover:scale-[1.03] hover:shadow-md'}
                    `}
                  >
                    <span className={`text-lg ${currentPath === item.href ? 'drop-shadow' : ''}`}>
                      {item.icon}
                    </span>
                    <span className="text-base">{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Profile Dropdown */}
        <div className="relative px-4 py-7" ref={dropdownRef}>
          <div
            className="flex items-center justify-between bg-white text-black rounded-xl p-2 cursor-pointer shadow-lg hover:shadow-xl transition"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-[#e6232a] overflow-hidden bg-[#e6232a] flex items-center justify-center">
                {user.profile_picture ? (
                  <img
                    src={getProfilePictureUrl(user.profile_picture) || '/images/profile.png'}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Replace failed image with user initials
                      const img = e.target as HTMLImageElement;
                      const parent = img.parentElement!;
                      parent.innerHTML = `<div class="w-full h-full bg-[#e6232a] flex items-center justify-center text-white font-bold text-lg">${user.first_name?.charAt(0).toUpperCase() || 'U'}</div>`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#e6232a] flex items-center justify-center text-white font-bold text-lg">
                    {user.first_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">{user.first_name}</p>
                <p className="text-xs opacity-80 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            <FaChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-52 bg-white text-black rounded-xl shadow-2xl z-50 text-base overflow-hidden border border-gray-200"
              >
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-5 py-3 hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FaUser className="text-sm" />
                  <span>Profile</span>
                </Link>
                <button
                  className="flex w-full items-center gap-2 px-5 py-3 hover:bg-gray-100 transition"
                  onClick={() => {
                    setDropdownOpen(false);
                    // Small delay to let dropdown close animation finish
                    setTimeout(() => setNotificationPanelOpen(true), 200);
                  }}
                >
                  <FaBell className="text-sm" />
                  <span>Notifications</span>
                </button>
                <hr className="border-t border-gray-200 my-1" />
                <button
                  className="flex w-full items-center gap-2 px-5 py-3 hover:bg-red-50 transition"
                  onClick={() => {
                    setShowConfirm(true);
                    setDropdownOpen(false);
                  }}
                >
                  <FaSignOutAlt className="text-sm text-red-500" />
                  <span className="text-red-500 font-semibold">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Panel - Outside of dropdown */}
          <NotificationPanel 
            isOpen={notificationPanelOpen} 
            onClose={() => setNotificationPanelOpen(false)}
          />
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[99999] animate-fade-in">
          <div className="bg-white text-black p-7 rounded-xl shadow-2xl w-[90%] max-w-sm relative">
            <h2 className="text-xl font-bold mb-2">Logout Confirmation</h2>
            <p className="text-base mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 text-base rounded bg-gray-200 hover:bg-gray-300 transition"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 text-base rounded bg-red-500 text-white hover:bg-red-600 transition font-semibold"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
