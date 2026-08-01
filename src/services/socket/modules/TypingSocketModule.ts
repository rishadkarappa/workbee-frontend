import { Socket } from 'socket.io-client';
import { SocketConnection } from '../connection/SocketConnection';

export class TypingSocketModule {
  private typingCallbacks: Set<(data: { userId: string; isTyping: boolean }) => void> = new Set();

  private connection: SocketConnection;
    constructor(connection: SocketConnection) {
        this.connection = connection;
    }

  private reattach(socket: Socket): void {
    this.typingCallbacks.forEach(cb => {
      socket.off('user_typing', cb);
      socket.on('user_typing', cb);
    });
  }

  sendTyping(chatId: string, isTyping: boolean): void {
    const socket = this.connection.getSocket();
    if (!socket?.connected) return;
    socket.emit('typing', { chatId, isTyping });
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    this.typingCallbacks.add(callback);
    const socket = this.connection.getSocket();
    if (socket) {
      socket.off('user_typing', callback);
      socket.on('user_typing', callback);
    }
  }

  offUserTyping(callback?: (data: { userId: string; isTyping: boolean }) => void): void {
    const socket = this.connection.getSocket();
    if (callback) {
      this.typingCallbacks.delete(callback);
      socket?.off('user_typing', callback);
    } else {
      this.typingCallbacks.forEach(cb => socket?.off('user_typing', cb));
      this.typingCallbacks.clear();
    }
  }

  clear(): void {
    this.typingCallbacks.clear();
  }
}