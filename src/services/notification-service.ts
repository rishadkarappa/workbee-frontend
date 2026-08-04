
import { NotificaionEndpoints } from "@/constants/api-endpoints/notification-endpoints";
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
    return api.get(NotificaionEndpoints.NOTIFICATION.GET_ALL, {
      params: { limit, offset }
    });
  },

  getUnreadCount: () => {
    return api.get(NotificaionEndpoints.NOTIFICATION.UNREAD_COUNT);
  },

  markAsRead: (notificationId: string) => {
    return api.patch(NotificaionEndpoints.NOTIFICATION.MARK_AS_READ(notificationId));
  },

  markAllAsRead: () => {
    return api.patch(NotificaionEndpoints.NOTIFICATION.MARK_ALL_READ);
  }
};
