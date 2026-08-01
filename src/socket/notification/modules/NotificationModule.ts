import { Socket } from 'socket.io-client';
import { NotificationSocketConnection } from '../connection/NotificationSocketConnection';
import type { Notification } from '@/services/notification-service';

export class NotificationModule {
  private connection: NotificationSocketConnection;
  private notificationCallbacks: Set<(notification: Notification) => void> = new Set();

  constructor(connection: NotificationSocketConnection) {
    this.connection = connection;
    this.connection.registerAttacher((socket) => this.reattach(socket));
  }

  private reattach(socket: Socket): void {
    this.notificationCallbacks.forEach(cb => {
      socket.off('new_notification', cb);
      socket.on('new_notification', cb);
    });
  }

  onNotification(callback: (notification: Notification) => void): void {
    this.notificationCallbacks.add(callback);
    const socket = this.connection.getSocket();
    if (socket) {
      socket.off('new_notification', callback);
      socket.on('new_notification', callback);
    }
  }

  offNotification(callback?: (notification: Notification) => void): void {
    const socket = this.connection.getSocket();
    if (callback) {
      this.notificationCallbacks.delete(callback);
      socket?.off('new_notification', callback);
    } else {
      this.notificationCallbacks.forEach(cb => socket?.off('new_notification', cb));
      this.notificationCallbacks.clear();
    }
  }

  clear(): void {
    this.notificationCallbacks.clear();
  }
}