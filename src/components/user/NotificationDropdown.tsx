import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, LucideCheckCheck } from "lucide-react";
import { NotificationService } from "@/services/notification-service";
import type { Notification } from "@/services/notification-service";
import { notificationSocketService } from "@/services/notification-socket-service";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationDropdown = ({ onNotificationClick }: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Stable reference — same function object across all renders.
  // Without useCallback, every render creates a NEW function reference.
  // The cleanup `offNotification(oldRef)` would fail to find the new ref
  // that was passed to `onNotification`, so old callbacks pile up.
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('🔔 New notification received in dropdown:', notification);

    setNotifications(prev => {
      const exists = prev.find(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ Duplicate notification blocked:', notification.id);
        return prev;
      }
      console.log('✅ Adding new notification to list');
      return [notification, ...prev];
    });

    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png'
      });
    }
  }, []); // empty deps — this never needs to change

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // ✅ Same stable reference passed to both on and off
    notificationSocketService.onNotification(handleNewNotification);

    return () => {
      // This now correctly removes the exact same reference
      notificationSocketService.offNotification(handleNewNotification);
    };
  }, [handleNewNotification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications(20, 0);
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      const count = response.data.data.count || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await NotificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.type === 'NEW_MESSAGE' && notification.data?.chatId) {
      navigate('/user-dashboard/messages', {
        state: {
          chatId: notification.data.chatId,
          userName: notification.data.senderName
        }
      });
    }

    setIsOpen(false);

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_MESSAGE': return '💬';
      case 'WORK_UPDATE': return '📋';
      case 'BOOKING_UPDATE': return '📅';
      case 'PAYMENT': return '💰';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full border hover:bg-gray-100 transition relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="border-b">
            <div className="p-4 pb-2">
              <h3 className="font-semibold text-lg">Notifications</h3>
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-full p-1">
                <button className="px-3 py-1 text-sm rounded-full bg-white shadow font-medium">
                  Unread
                </button>
                <button className="px-3 py-1 text-sm rounded-full text-gray-600 hover:text-black">
                  All
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-black whitespace-nowrap"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-900 rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <LucideCheckCheck className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;