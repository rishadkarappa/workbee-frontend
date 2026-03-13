import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { NotificationService } from "@/services/notification-service";
import type { Notification } from "@/services/notification-service";
import { notificationSocketService } from "@/services/notification-socket-service";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  onNotificationClick?: (notification: Notification) => void;
}

type TabType = "unread" | "all";

const WorkerNotificationDropdown = ({
  onNotificationClick,
}: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("unread");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  const handleMarkOneAsRead = async (
    e: React.MouseEvent,
    notification: Notification
  ) => {
    e.stopPropagation();

    if (notification.isRead) return;

    try {
      await NotificationService.markAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await NotificationService.markAsRead(notification.id);

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Worker-side navigation: route to worker messages dashboard
    if (notification.type === "NEW_MESSAGE" && notification.data?.chatId) {
      navigate("/worker/worker-dashboard/messages", {
        state: {
          chatId: notification.data.chatId,
          userName: notification.data.senderName,
        },
      });
    }

    setIsOpen(false);
    onNotificationClick?.(notification);
  };

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
      case "NEW_MESSAGE":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "WORK_UPDATE":
        return <ClipboardList className="w-5 h-5 text-purple-500" />;
      case "BOOKING_UPDATE":
        return <CalendarDays className="w-5 h-5 text-green-500" />;
      case "PAYMENT":
        return <CreditCard className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full border hover:bg-gray-100 transition relative"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-[420px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b">
            <div className="px-4 pt-3 pb-2">
              <h3 className="font-semibold text-base">Notifications</h3>
            </div>

            {/* Tabs */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-full p-1 gap-1">
                <button
                  onClick={() => setActiveTab("unread")}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    activeTab === "unread"
                      ? "bg-white shadow text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1.5 bg-gray-700 text-white text-[10px] rounded-full px-1.5 py-[1px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
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
                  className="px-3 py-1 text-[11px] font-medium text-gray-700 bg-gray-100 rounded-full shadow-sm hover:bg-gray-200 transition cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-7 h-7 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Loading...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {activeTab === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex gap-3 items-start">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium leading-tight">
                          {notification.title}
                        </h4>

                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-black rounded-full mt-1 ml-2" />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {notification.message}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleMarkOneAsRead(e, notification)}
                      className={`p-1.5 rounded-full mt-1 ${
                        notification.isRead
                          ? "text-green-700"
                          : "text-gray-500 hover:bg-gray-100"
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

export default WorkerNotificationDropdown;