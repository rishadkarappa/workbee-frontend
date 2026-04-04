import { io, Socket } from 'socket.io-client';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private token: string | null = null;

  private messageCallbacks: Set<(message: any) => void> = new Set();
  private typingCallbacks: Set<(data: { userId: string; isTyping: boolean }) => void> = new Set();
  private progressCallbacks: Set<(data: { workId: string; progress: string }) => void> = new Set();

  private joinedChatIds: Set<string> = new Set();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token: string) {
    if (this.socket?.connected && this.token === token) {
      return;
    }

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
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] connected:', this.socket?.id);
      this.joinedChatIds.forEach(chatId => {
        this.socket!.emit('join_chat', chatId);
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
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

    this._reattachCallbacks();
  }

  ensureConnected(): Promise<void> {
    if (this.socket?.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const latestToken = this._getLatestToken() || this.token;
      if (!latestToken) {
        return reject(new Error('No token available to reconnect'));
      }

      this.connect(latestToken);

      const timeout = setTimeout(() => {
        reject(new Error('Socket reconnect timed out'));
      }, 10000);

      const onConnect = () => {
        clearTimeout(timeout);
        this.socket?.off('connect_error', onError);
        resolve();
      };

      const onError = (err: Error) => {
        console.warn('[Socket] reconnect attempt error:', err.message);
      };

      this.socket!.once('connect', onConnect);
      this.socket!.on('connect_error', onError);
    });
  }

  private _getLatestToken(): string | null {
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
      this.socket!.off('new_message', cb);
      this.socket!.on('new_message', cb);
    });
    this.typingCallbacks.forEach(cb => {
      this.socket!.off('user_typing', cb);
      this.socket!.on('user_typing', cb);
    });
    this.progressCallbacks.forEach(cb => {
      this.socket!.off('work_progress_changed', cb);
      this.socket!.on('work_progress_changed', cb);
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
    this.progressCallbacks.clear();
    this.joinedChatIds.clear();
  }

  joinChat(chatId: string) {
    this.joinedChatIds.add(chatId);
    if (!this.socket?.connected) {
      console.warn('[Socket] not connected — chat room queued, will rejoin on reconnect');
      return;
    }
    this.socket.emit('join_chat', chatId);
  }

  leaveChat(chatId: string) {
    this.joinedChatIds.delete(chatId);
    if (!this.socket?.connected) return;
    this.socket.emit('leave_chat', chatId);
  }

  async sendMessage(data: {
    chatId: string;
    content: string;
    type?: string;
    recipientId?: string;
    mediaUrl?: string;
    mediaPublicId?: string;
  }): Promise<void> {
    try {
      await this.ensureConnected();
      this.socket!.emit('send_message', data);
    } catch (err) {
      console.error('[Socket] sendMessage failed — could not reconnect:', err);
      throw err;
    }
  }

  // ── Ask worker to confirm the deal ───────────────────────────────────────
  async askForConfirm(data: {
    chatId:     string;
    workId:     string;
    workTitle:  string;
    workerId:   string;
    workerName: string;
    userId:     string;
  }): Promise<void> {
    try {
      await this.ensureConnected();
      this.socket!.emit('ask_for_confirm', data);
    } catch (err) {
      console.error('[Socket] askForConfirm failed:', err);
      throw err;
    }
  }

  // ── User responds to confirmation request ────────────────────────────────
  // workerId is required so the socket server can push to worker's personal room
  async confirmResponse(data: {
    chatId:     string;
    workId:     string;
    workTitle:  string;
    accepted:   boolean;
    userId:     string;
    workerName: string;
    workerId:   string;   // REQUIRED — identifies worker's personal room
  }): Promise<void> {
    try {
      await this.ensureConnected();
      this.socket!.emit('confirm_response', data);
    } catch (err) {
      console.error('[Socket] confirmResponse failed:', err);
      throw err;
    }
  }

  // ── Worker updates work progress ─────────────────────────────────────────
  async updateWorkProgress(data: {
    chatId:    string;
    workId:    string;
    workTitle: string;
    progress:  string;
    workerId:  string;
  }): Promise<void> {
    try {
      await this.ensureConnected();
      this.socket!.emit('work_progress_update', data);
    } catch (err) {
      console.error('[Socket] updateWorkProgress failed:', err);
      throw err;
    }
  }

  onNewMessage(callback: (message: any) => void) {
    this.messageCallbacks.add(callback);
    if (this.socket) {
      this.socket.off('new_message', callback);
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage(callback?: (message: any) => void) {
    if (callback) {
      this.messageCallbacks.delete(callback);
      this.socket?.off('new_message', callback);
    } else {
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

  // ── Real-time progress listener ───────────────────────────────────────────
  onWorkProgressChanged(callback: (data: { workId: string; progress: string }) => void) {
    this.progressCallbacks.add(callback);
    if (this.socket) {
      this.socket.off('work_progress_changed', callback);
      this.socket.on('work_progress_changed', callback);
    }
  }

  offWorkProgressChanged(callback?: (data: { workId: string; progress: string }) => void) {
    if (callback) {
      this.progressCallbacks.delete(callback);
      this.socket?.off('work_progress_changed', callback);
    } else {
      this.progressCallbacks.forEach(cb => this.socket?.off('work_progress_changed', cb));
      this.progressCallbacks.clear();
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