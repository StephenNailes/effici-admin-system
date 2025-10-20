import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaBell, FaTimes, FaCheck, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
// Removed lucide-react icons to simplify and avoid unused imports
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  action_url?: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  time_ago: string;
  created_at: string;
}

interface NotificationPanelProps {
  className?: string;
  onOpen?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function NotificationPanel({ className = '', onOpen, isOpen: externalIsOpen, onClose }: NotificationPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Use shared notification context
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead: contextMarkAllAsRead, 
    deleteNotification,
    fetchedAt,
    fetchNotifications,
  } = useNotifications();

  // Remove emoji characters for cleaner, icon-driven UI (no emoji)
  const stripEmoji = (input: string) => {
    if (!input) return input;
    // Covers common emoji ranges and presentation selectors
    const emojiRegex = /[\p{Emoji}\p{Extended_Pictographic}\uFE0F\u200D]/gu;
    return input.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim();
  };
  
  // Use external isOpen if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose ? onClose : setInternalIsOpen;

  // Debug: Track isOpen changes
  useEffect(() => {
    console.log('NotificationPanel - isOpen changed to:', isOpen);
    if (isOpen && fetchedAt) {
      // Log how long it took since fetch to reflect in the panel
      const elapsedMs = Date.now() - fetchedAt;
      const secs = (elapsedMs / 1000).toFixed(2);
      const mins = (elapsedMs / 1000 / 60).toFixed(2);
      console.log(`🕒 Notifications reflected in panel after ${secs}s (~${mins}m) from fetch.`);
    }
    // Guard: when opening, refresh if we have no data or it's stale (>15s)
    if (isOpen) {
      const stale = !fetchedAt || (Date.now() - fetchedAt > 15000);
      const empty = !notifications || notifications.length === 0;
      if (stale || empty) {
        console.log('🔄 Refreshing notifications on open', { stale, empty });
        fetchNotifications(true);
      }
    }
  }, [isOpen]);

  // Filter high priority notifications for urgent section
  const urgentNotifications = notifications.filter(n => n.priority === 'high' && !n.is_read);
  // Include notifications with unknown/null priority as regular so they remain visible
  const regularNotifications = notifications.filter(n => n.priority !== 'high' || n.is_read);

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await contextMarkAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert('Failed to mark notifications as read. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      router.visit(notification.action_url);
    }
    
    // Close panel
    if (externalIsOpen !== undefined && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <FaExclamationTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <FaBell className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <FaBell className="w-4 h-4 text-gray-500" />;
      default: // medium as fallback
        return <FaBell className="w-4 h-4 text-blue-500" />;
    }
  };

  // Choose a single, relevant icon based on notification content
  const getNotificationIcon = (n: NotificationData) => {
    const type = (n.type || '').toLowerCase();
    const full = `${n.title} ${n.message}`.toLowerCase();
    // Success/approval
    if (type.includes('approved') || type.includes('approval') || full.includes('approved') || full.includes('success')) {
      return <FaCheck className="w-4 h-4 text-green-600" />;
    }
    // Warnings/deadlines/overdue
    if (type.includes('warning') || type.includes('deadline') || type.includes('overdue') || n.priority === 'high') {
      return <FaExclamationTriangle className="w-4 h-4 text-red-600" />;
    }
    // Default informational
    return <FaBell className="w-4 h-4 text-gray-600" />;
  };

  // Use colored left border to denote category, and background only when unread
  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-600';
      case 'medium':
        return 'border-l-4 border-blue-600';
      case 'low':
        return 'border-l-4 border-gray-400';
      default:
        return 'border-l-4 border-blue-600';
    }
  };

  const getUnreadBg = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50';
      case 'medium':
        return 'bg-blue-50';
      case 'low':
        return 'bg-gray-50';
      default:
        return 'bg-blue-50';
    }
  };

  const getPriorityTag = (priority: string) => {
    if (priority === 'high') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-red-600 text-white">HIGH</span>;
    return null;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Only render button when NOT externally controlled */}
      {externalIsOpen === undefined && (
        <button
          data-notification-button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Notification button clicked, current isOpen:', isOpen);
            
            // Internal control
            const newIsOpen = !internalIsOpen;
            setInternalIsOpen(newIsOpen);
            console.log('Setting internal isOpen to:', newIsOpen);
            if (newIsOpen && onOpen) {
              console.log('Calling onOpen callback');
              onOpen();
            }
          }}
          className={`flex w-full items-center gap-2 px-5 py-3 hover:bg-gray-100 transition relative ${className}`}
        >
          <FaBell className="text-sm" />
          <span>Notifications</span>
        </button>
      )}

      {/* Render external panel when controlled from outside */}
      {externalIsOpen && createPortal(
        <>
          {/* Backdrop to ensure panel sits above content and intercepts clicks */}
          <div
            className="fixed inset-0 z-[2147483646] bg-transparent"
            onClick={() => onClose && onClose()}
          />
          <motion.div
            data-notification-panel
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-8 left-[17rem] w-96 bg-white text-black rounded-xl shadow-2xl z-[2147483647] text-base overflow-hidden border border-gray-200 max-h-[70vh]"
          >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <FaBell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {/* Removed redundant PRIORITY pill/banner per design review */}
            </div>
            <button
              onClick={() => onClose && onClose()}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Urgent/High notifications first (no banner) */}
            {urgentNotifications.length > 0 && (
              <>
                {urgentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b cursor-pointer transition-colors ${getPriorityBorder(notification.priority)} ${getUnreadBg(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{stripEmoji(notification.title)}</p>
                            {getPriorityTag(notification.priority)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{stripEmoji(notification.message)}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{notification.time_ago}</p>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                className="text-xs text-gray-700 hover:text-gray-900 flex items-center gap-1 font-medium"
                              >
                                <FaCheck className="w-3 h-3" />
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                              className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 font-medium"
                              title="Delete notification"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Regular Notifications Section */}
            {regularNotifications.length > 0 ? (
              regularNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${getPriorityBorder(notification.priority)} ${!notification.is_read ? getUnreadBg(notification.priority) : 'bg-white'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{stripEmoji(notification.title)}</p>
                          {getPriorityTag(notification.priority)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{stripEmoji(notification.message)}</p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {notification.time_ago}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                              <FaCheck className="w-3 h-3" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            title="Delete notification"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : urgentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FaCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          {(urgentNotifications.length > 0 || regularNotifications.length > 0) && unreadCount > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="w-full text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 transition"
              >
                {loading ? 'Marking as read...' : 'Mark all as read'}
              </button>
            </div>
          )}
          </motion.div>
        </>,
        document.body
      )}

      {/* Production Panel */}
      <AnimatePresence>
        {false && (
          <motion.div
            data-notification-panel-original
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-4 w-96 bg-white text-black rounded-xl shadow-2xl z-[9999] text-base overflow-hidden border-2 border-red-500 max-h-[80vh]"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <FaBell className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${getPriorityBorder(notification.priority)} ${!notification.is_read ? getUnreadBg(notification.priority) : 'bg-white'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{stripEmoji(notification.title)}</p>
                              {getPriorityTag(notification.priority)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{stripEmoji(notification.message)}</p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {notification.time_ago}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <FaCheck className="w-3 h-3" />
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                                title="Delete notification"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <FaCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">No notifications</p>
                    <p className="text-xs text-gray-400">You're all caught up!</p>
                  </div>
                )}
              </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}