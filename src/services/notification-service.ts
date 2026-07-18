
import { api } from "./axios-instance/axios-instance";

export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_MESSAGE' | 'WORK_UPDATE' | 'BOOKING_UPDATE' | 'PAYMENT';
  title: string;
  message: string;
  data?: {
    chatId?: string;
    senderId?: string;
    senderName?: string;
    senderRole?: 'user' | 'worker';
  };
  isRead: boolean;
  createdAt: Date;
}

export const NotificationService = {
  getNotifications: (limit?: number, offset?: number) => {
    return api.get("/notification/notifications", {
      params: { limit, offset }
    });
  },

  getUnreadCount: () => {
    return api.get("/notification/notifications/unread-count");
  },

  markAsRead: (notificationId: string) => {
    return api.patch(`/notification/notifications/${notificationId}/read`);
  },

  markAllAsRead: () => {
    return api.patch("/notification/notifications/mark-all-read");
  }
};
