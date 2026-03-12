import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationService } from "@/services/notification-service";
import type { Notification } from "@/services/notification-service";
import { notificationSocketService } from "@/services/notification-socket-service";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  onNotificationClick?: (notification: Notification) => void;
}

type TabType = "unread" | "all";

const NotificationDropdown = ({ onNotificationClick }: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Single source of truth — ALL notifications live here.
  // Filtering happens client-side based on activeTab. No separate API call per tab.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // activeTab drives what's shown
  const [activeTab, setActiveTab] = useState<TabType>("unread");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Derived from state — no extra API calls
  const displayedNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      const exists = prev.find((n) => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
    // Use window.Notification to avoid name conflict with our Notification type
    if (window.Notification?.permission === "granted") {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: "/logo.png",
      });
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    notificationSocketService.onNotification(handleNewNotification);
    return () => {
      notificationSocketService.offNotification(handleNewNotification);
    };
  }, [handleNewNotification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (window.Notification?.permission === "default") {
      window.Notification.requestPermission();
    }
  }, []);

  // Loads all notifications from DB on mount.
  // Notifications persist across refreshes because they're in MongoDB.
  // They were disappearing because the GET was returning 401 (fixed in backend).
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications(50, 0);
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      setUnreadCount(response.data.data.count || 0);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  // Clicking the icon marks ONE notification as read.
  // It disappears from Unread tab and stays visible in All tab (as read).
  const handleMarkOneAsRead = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // don't trigger the row click / navigation
    if (notification.isRead) return;

    try {
      await NotificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Clicking a row marks it read AND navigates if it's a message
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await NotificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    if (notification.type === "NEW_MESSAGE" && notification.data?.chatId) {
      navigate("/user-dashboard/messages", {
        state: {
          chatId: notification.data.chatId,
          userName: notification.data.senderName,
        },
      });
    }

    setIsOpen(false);
    onNotificationClick?.(notification);
  };

  // Marks ALL as read.
  // After this: Unread tab → empty, All tab → all shown without blue dot.
  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_MESSAGE":    return "💬";
      case "WORK_UPDATE":    return "📋";
      case "BOOKING_UPDATE": return "📅";
      case "PAYMENT":        return "💰";
      default:               return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full border hover:bg-gray-100 transition relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[500px] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="border-b flex-shrink-0">
            <div className="p-4 pb-2">
              <h3 className="font-semibold text-lg">Notifications</h3>
            </div>

            {/* ab buttons wired to activeTab state */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-full p-1 gap-1">
                <button
                  onClick={() => setActiveTab("unread")}
                  className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
                    activeTab === "unread"
                      ? "bg-white shadow text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1.5 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
                    activeTab === "all"
                      ? "bg-white shadow text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  All
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Loading...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">
                  {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-snug">{notification.title}</h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Real button — marks individual notification as read */}
                    <button
                      onClick={(e) => handleMarkOneAsRead(e, notification)}
                      title={notification.isRead ? "Already read" : "Mark as read"}
                      className={`flex-shrink-0 p-1.5 rounded-full transition-colors mt-0.5 ${
                        notification.isRead
                          ? "text-green-500 cursor-default"
                          : "text-gray-300 hover:text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
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