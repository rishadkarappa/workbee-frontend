import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CalendarDays, CheckCheck, ClipboardList, CreditCard, MessageCircle } from "lucide-react";
import { NotificationService } from "@/services/notification-service";
import type { Notification } from "@/services/notification-service";
import { notificationSocketService } from "@/services/notification-socket-service";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { AppRoutes } from "@/constants/routes/app-routes";

interface NotificationDropdownProps {
  onNotificationClick?: (notification: Notification) => void;
}

type TabType = "unread" | "all";

const NotificationDropdown = ({ onNotificationClick }: NotificationDropdownProps) => {

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("unread");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
    notificationSocketService.onNotification(handleNewNotification);
    return () => notificationSocketService.offNotification(handleNewNotification);
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

  const handleMarkOneAsRead = async (e: React.MouseEvent, notification: Notification) => {
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

    if (notification.type === "NEW_MESSAGE" && notification.data?.chatId) {
      navigate(AppRoutes.USER.DASHBOARD.MESSAGES, {
        state: {
          chatId: notification.data.chatId,
          userName: notification.data.senderName,
        },
      });
    }
    if (notification.type === "WORK_UPDATE" && notification.data?.workId) {
      navigate(AppRoutes.USER.DASHBOARD.ACTIVE_WORKS,{
          state: {
            workId:
              notification.data.workId,
          },
        }
      );
    }

    setIsOpen(false);
    onNotificationClick?.(notification);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {

    switch (type) {

      case "NEW_MESSAGE":
        return <MessageCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />;

      case "WORK_UPDATE":
        return <ClipboardList className="w-5 h-5 text-purple-500 dark:text-purple-400" />;

      case "BOOKING_UPDATE":
        return <CalendarDays className="w-5 h-5 text-green-500 dark:text-green-400" />;

      case "PAYMENT":
        return <CreditCard className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;

      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (

    <div className="relative" ref={dropdownRef}>

      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full border border-border hover:bg-accent transition relative"
      >
        <Bell className="w-5 h-5 text-foreground" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (

        <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-50 max-h-[420px] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="border-b border-border">

            <div className="px-4 pt-3 pb-2">
              <h3 className="font-semibold text-base text-foreground">Notifications</h3>
            </div>

            {/* Tabs */}
            <div className="px-4 pb-3 flex items-center justify-between">

              <div className="flex bg-muted rounded-full p-1 gap-1">

                <button
                  onClick={() => setActiveTab("unread")}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${activeTab === "unread"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1.5 bg-foreground text-background text-[10px] rounded-full px-1.5 py-[1px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${activeTab === "all"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  All
                </button>

              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1 text-[11px] font-medium text-foreground bg-muted rounded-full shadow-sm hover:bg-accent transition cursor-pointer"
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
                <div className="w-7 h-7 border-4 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Loading...</p>
              </div>

            ) : displayedNotifications.length === 0 ? (

              <div className="p-6 text-center text-muted-foreground">
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
                  className="px-4 py-3 border-b border-border cursor-pointer hover:bg-accent transition"
                >

                  <div className="flex gap-3 items-start">

                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1">

                      <div className="flex justify-between items-start">

                        <h4 className="text-sm font-medium leading-tight text-foreground">
                          {notification.title}
                        </h4>

                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-foreground rounded-full mt-1 ml-2" />
                        )}

                      </div>

                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {notification.message}
                      </p>

                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(
                          new Date(notification.createdAt),
                          { addSuffix: true }
                        )}
                      </p>

                    </div>

                    <button
                      onClick={(e) => handleMarkOneAsRead(e, notification)}
                      className={`p-1.5 rounded-full mt-1 ${notification.isRead
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground hover:bg-accent"
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