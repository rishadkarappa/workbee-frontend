import { io, Socket } from 'socket.io-client';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private token: string | null = null;
  // Store callbacks by reference so we can remove exactly the right one
  private messageCallbacks: Set<(message: any) => void> = new Set();
  private typingCallbacks: Set<(data: { userId: string; isTyping: boolean }) => void> = new Set();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token: string) {
    // Already connected with same token — nothing to do
    if (this.socket?.connected && this.token === token) {
      console.log('[Socket] already connected');
      return;
    }

    // Always fully tear down before reconnecting (handles token refresh,
    // StrictMode double-invoke, re-renders)
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.token = token;

    this.socket = io(import.meta.env.VITE_COMMUNICATION_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);

      // If the server killed the connection (e.g. auth failed after token
      // expiry), try to reconnect with the latest token from storage
      if (reason === 'io server disconnect' || reason === 'transport error') {
        const latestToken = this._getLatestToken();
        if (latestToken && latestToken !== this.token) {
          console.log('[Socket] reconnecting with refreshed token');
          setTimeout(() => this.connect(latestToken), 1000);
        }
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('[Socket] error:', error.message);
    });

    // Register all currently stored callbacks on the new socket
    // This handles the case where connect() is called after callbacks
    // were already registered (e.g. token refresh mid-session)
    this._reattachCallbacks();
  }

  private _getLatestToken(): string | null {
    // Read from wherever your AuthHelper stores the token
    try {
      return (
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken') ||
        null
      );
    } catch {
      return null;
    }
  }

  private _reattachCallbacks() {
    if (!this.socket) return;
    this.messageCallbacks.forEach(cb => {
      this.socket!.on('new_message', cb);
    });
    this.typingCallbacks.forEach(cb => {
      this.socket!.on('user_typing', cb);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
  }

  joinChat(chatId: string) {
    if (!this.socket?.connected) {
      console.error('[Socket] not connected — cannot join chat');
      return;
    }
    this.socket.emit('join_chat', chatId);
  }

  leaveChat(chatId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_chat', chatId);
  }

  sendMessage(data: {
    chatId: string;
    content: string;
    type?: string;
    recipientId?: string;
  }) {
    if (!this.socket?.connected) {
      console.error('[Socket] cannot send — not connected');
      return;
    }
    this.socket.emit('send_message', data);
  }

  // Register by reference — same callback added twice is ignored (Set)
  onNewMessage(callback: (message: any) => void) {
    this.messageCallbacks.add(callback);
    if (this.socket) {
      // Remove first to avoid duplicate listeners if called multiple times
      this.socket.off('new_message', callback);
      this.socket.on('new_message', callback);
    }
  }

  // Remove only THIS callback, not all listeners
  offNewMessage(callback?: (message: any) => void) {
    if (callback) {
      this.messageCallbacks.delete(callback);
      this.socket?.off('new_message', callback);
    } else {
      // No callback given — remove all (legacy fallback)
      this.messageCallbacks.forEach(cb => this.socket?.off('new_message', cb));
      this.messageCallbacks.clear();
    }
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingCallbacks.add(callback);
    if (this.socket) {
      this.socket.off('user_typing', callback);
      this.socket.on('user_typing', callback);
    }
  }

  offUserTyping(callback?: (data: { userId: string; isTyping: boolean }) => void) {
    if (callback) {
      this.typingCallbacks.delete(callback);
      this.socket?.off('user_typing', callback);
    } else {
      this.typingCallbacks.forEach(cb => this.socket?.off('user_typing', cb));
      this.typingCallbacks.clear();
    }
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { chatId, isTyping });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = SocketService.getInstance();