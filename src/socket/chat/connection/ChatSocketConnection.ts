import { Socket } from 'socket.io-client';
import { BaseSocketConnection } from '@/socket/shared-connection/BaseSocketConnection';

export class ChatSocketConnection extends BaseSocketConnection {
  private joinedChatIds: Set<string> = new Set();

  protected getUrl(): string {
    return import.meta.env.VITE_COMMUNICATION_URL;
  }

  protected onSocketCreated(socket: Socket): void {
    socket.on('connect', () => {
      this.joinedChatIds.forEach(chatId => socket.emit('join_chat', chatId));
    });
  }

  joinChat(chatId: string): void {
    this.joinedChatIds.add(chatId);
    if (!this.socket?.connected) {
      console.warn('[Socket] not connected — chat room queued, will rejoin on reconnect');
      return;
    }
    this.socket.emit('join_chat', chatId);
  }

  leaveChat(chatId: string): void {
    this.joinedChatIds.delete(chatId);
    if (!this.socket?.connected) return;
    this.socket.emit('leave_chat', chatId);
  }

  disconnect(): void {
    super.disconnect();
    this.joinedChatIds.clear();
  }
}