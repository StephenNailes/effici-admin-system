import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  action_url?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
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
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Use external isOpen if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose ? onClose : setInternalIsOpen;

  // Debug: Track isOpen changes
  useEffect(() => {
    console.log('NotificationPanel - isOpen changed to:', isOpen);
  }, [isOpen]);

  // Fetch notifications on component mount and periodically
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Refresh notifications when page becomes visible (handles navigation back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Find the notification panel element
      const notificationPanel = document.querySelector('[data-notification-panel]');
      const notificationButton = document.querySelector('[data-notification-button]');
      
      if (notificationPanel && notificationButton) {
        // Don't close if clicking on the panel or button
        if (notificationPanel.contains(event.target as Node) || 
            notificationButton.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await axios.post('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
      case 'urgent':
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FaBell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
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
          {unreadCount > 0 && (
            <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Render external panel when controlled from outside */}
      {externalIsOpen && (
        <motion.div
          data-notification-panel-external
          initial={{ opacity: 0, x: -20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-8 left-[17rem] w-96 bg-white text-black rounded-xl shadow-2xl z-[9999] text-base overflow-hidden border border-gray-200 max-h-[80vh]"
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
              onClick={() => onClose && onClose()}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50
                    ${!notification.is_read ? 'bg-blue-25' : ''}
                    ${getPriorityColor(notification.priority)}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {notification.time_ago}
                        </p>
                        
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
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <FaCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="w-full text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 transition"
              >
                {loading ? 'Marking as read...' : 'Mark all as read'}
              </button>
            </div>
          )}
        </motion.div>
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
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50
                        ${!notification.is_read ? 'bg-blue-25' : ''}
                        ${getPriorityColor(notification.priority)}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {notification.time_ago}
                            </p>
                            
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