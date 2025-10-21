import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

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

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  fetchedAt: number | null; // epoch ms when notifications were fetched
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  isAuthenticated?: boolean; // passed from app shell so we only fetch once user is logged in
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, isAuthenticated: initialAuth = false }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);

  // Update authentication state when it changes from props or Inertia page
  useEffect(() => {
    setIsAuthenticated(initialAuth);
  }, [initialAuth]);

  // Also check Inertia page props for auth state changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        const anyRouter: any = router as any;
        const currentPage = anyRouter?.page;
        const authed = Boolean(currentPage?.props?.auth?.user);
        if (authed !== isAuthenticated) {
          console.log('🔐 Auth state changed:', { from: isAuthenticated, to: authed });
          setIsAuthenticated(authed);
        }
      } catch (e) {
        // no-op
      }
    };

    checkAuth(); // Check immediately
    
    const anyRouter: any = router as any;
    anyRouter?.on?.('navigate', checkAuth);
    anyRouter?.on?.('finish', checkAuth);
    
    return () => {
      anyRouter?.off?.('navigate', checkAuth);
      anyRouter?.off?.('finish', checkAuth);
    };
  }, [isAuthenticated]);

  // Debounced fetch function - only fetch if 3 seconds have passed since last fetch
  const fetchNotifications = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch;
    
    // Prevent fetching if called within 3 seconds of last fetch (client-side rate limiting)
    if (!force && timeSinceLastFetch < 3000 && lastFetch > 0) {
      console.log('⏸️ Skipping notification fetch - too soon since last fetch');
      return;
    }

    try {
      const start = Date.now();
      console.log('📡 Fetching notifications...');
      setLoading(true);
  const response = await axios.get('/api/notifications', { withCredentials: true });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
      setLastFetch(now);
      setFetchedAt(start);
      const tookMs = Date.now() - start;
      const tookSec = (tookMs / 1000).toFixed(2);
      console.log(`✅ Notifications fetched successfully in ${tookSec}s`);
    } catch (error: any) {
      // Handle 401 errors gracefully - user not authenticated yet
      if (error?.response?.status === 401) {
        console.log('🔒 Not authenticated yet, will retry later');
        // Don't update lastFetch so we can retry sooner
        return;
      }
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      console.log(`📖 Marking notification ${notificationId} as read...`);
      const response = await axios.post(`/api/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        console.log(`✅ Notification ${notificationId} marked as read`);
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error(`❌ Failed to mark notification ${notificationId} as read`);
      }
    } catch (error) {
      console.error(`❌ Error marking notification ${notificationId} as read:`, error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.post('/api/notifications/mark-all-read');
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`);
      
      if (response.data.success) {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Single fetch after login: trigger when authenticated and on Inertia navigations
  useEffect(() => {
    // If we already know we're authenticated, fetch once
    if (isAuthenticated && !fetchedAt) {
      console.log('🔔 Auto-fetching notifications on mount (authenticated)');
      fetchNotifications();
    }

    // Also listen to Inertia navigation finishes to detect auth becoming available
    const anyRouter: any = router as any;
    const onFinish = () => {
      try {
        const currentPage = anyRouter?.page;
        const authed = Boolean(currentPage?.props?.auth?.user);
        if (authed && !fetchedAt) {
          console.log('🔔 Auto-fetching notifications after Inertia navigation (authenticated)');
          fetchNotifications();
        }
      } catch (e) {
        // no-op
      }
    };
    anyRouter?.on?.('finish', onFinish);
    // Also listen to DOM Inertia events for broader compatibility
    const domFinish = () => onFinish();
    window.addEventListener('inertia:finish', domFinish);
    // Run once to catch already-finished initial navigation
    onFinish();
    return () => {
      anyRouter?.off?.('finish', onFinish);
      window.removeEventListener('inertia:finish', domFinish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, fetchedAt]);

  // Additional effect: Fetch notifications periodically (every 30 seconds) when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up interval to refresh notifications every 30 seconds
    const intervalId = setInterval(() => {
      console.log('🔄 Periodic notification refresh (30s interval)');
      fetchNotifications(false); // Use debounced fetch
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchedAt,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
