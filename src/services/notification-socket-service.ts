import { NotificationSocketConnection } from '@/socket/notification/connection/NotificationSocketConnection';
import { NotificationModule } from '@/socket/notification/modules/NotificationModule';
import type { Notification } from './notification-service';

export type { Notification };

class NotificationSocketService {
  private static instance: NotificationSocketService;

  private connection = new NotificationSocketConnection();
  private notifications = new NotificationModule(this.connection);

  private constructor() {}

  static getInstance(): NotificationSocketService {
    if (!NotificationSocketService.instance) {
      NotificationSocketService.instance = new NotificationSocketService();
    }
    return NotificationSocketService.instance;
  }

  connect(token: string): void { this.connection.connect(token); }
  disconnect(): void {
    this.connection.disconnect();
    this.notifications.clear();
  }
  isConnected(): boolean { return this.connection.isConnected(); }

  onNotification = (cb: Parameters<NotificationModule['onNotification']>[0]) => this.notifications.onNotification(cb);
  offNotification = (cb?: Parameters<NotificationModule['offNotification']>[0]) => this.notifications.offNotification(cb);
}

export const notificationSocketService = NotificationSocketService.getInstance();