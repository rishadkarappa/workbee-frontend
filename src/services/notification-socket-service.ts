import { io, Socket } from 'socket.io-client';
import type { Notification } from './notification-service';

class NotificationSocketService {
  private static instance: NotificationSocketService;
  private socket: Socket | null = null;
  private token: string | null = null;
  // Use Set so same callback reference is never registered twice
  private notificationCallbacks: Set<(notification: Notification) => void> = new Set();

  private constructor() {}

  static getInstance(): NotificationSocketService {
    if (!NotificationSocketService.instance) {
      NotificationSocketService.instance = new NotificationSocketService();
    }
    return NotificationSocketService.instance;
  }

  connect(token: string) {
    // If already connected with the same token, do nothing
    if (this.socket?.connected && this.token === token) {
      console.log('Notification socket already connected');
      return;
    }

    // Always tear down the old socket fully before creating a new one.
    // Without this, calling connect() a second time (React StrictMode, re-renders,
    // token refresh) skips the `if (socket?.connected)` guard but the OLD socket
    // still has its `new_notification` listener registered. The new socket adds
    // a second listener → every event fires twice → count doubles.
    
    if (this.socket) {
      this.socket.removeAllListeners(); // remove new_notification + all others
      this.socket.disconnect();
      this.socket = null;
    }

    this.token = token;

    this.socket = io(import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:4004', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Notification socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Notification socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Notification socket disconnected:', reason);
    });

    // Registered exactly ONCE per fresh socket instance
    this.socket.on('new_notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      this.notificationCallbacks.forEach(callback => callback(notification));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
  }

  onNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.add(callback);
  }

  offNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.delete(callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const notificationSocketService = NotificationSocketService.getInstance();