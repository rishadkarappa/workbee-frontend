import { Socket } from 'socket.io-client';
import { BaseSocketConnection } from '@/socket/shared-connection/BaseSocketConnection';

export class NotificationSocketConnection extends BaseSocketConnection {
  protected getUrl(): string {
    return import.meta.env.VITE_NOTIFICATION_URL;
  }

  protected onSocketCreated(_socket: Socket): void { } // no connection-time-only behavior needed for notifications
}