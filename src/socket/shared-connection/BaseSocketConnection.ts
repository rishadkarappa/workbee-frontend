import { io, Socket } from 'socket.io-client';

type Attacher = (socket: Socket) => void;

export abstract class BaseSocketConnection {
  protected socket: Socket | null = null;
  protected token: string | null = null;
  private attachers: Attacher[] = [];

  protected abstract getUrl(): string;
  protected abstract onSocketCreated(socket: Socket): void;

  registerAttacher(attacher: Attacher): void {
    this.attachers.push(attacher);
    if (this.socket) attacher(this.socket);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  connect(token: string): void {
    if (this.socket?.connected && this.token === token) return;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.token = token;

    this.socket = io(this.getUrl(), {
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
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport error') {
        const latestToken = this.getLatestToken();
        if (latestToken && latestToken !== this.token) {
          console.log('[Socket] reconnecting with refreshed token');
          setTimeout(() => this.connect(latestToken), 1000);
        }
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('[Socket] error:', error.message);
    });

    this.onSocketCreated(this.socket);
    this.attachers.forEach(attach => attach(this.socket!));
  }

  ensureConnected(): Promise<void> {
    if (this.socket?.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const latestToken = this.getLatestToken() || this.token;
      if (!latestToken) {
        return reject(new Error('No token available to reconnect'));
      }

      this.connect(latestToken);

      const timeout = setTimeout(() => reject(new Error('Socket reconnect timed out')), 10000);

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

  async emitEnsured(event: string, data: unknown): Promise<void> {
    await this.ensureConnected();
    this.socket!.emit(event, data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
  }

  protected getLatestToken(): string | null {
    try {
      return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || null;
    } catch {
      return null;
    }
  }
}