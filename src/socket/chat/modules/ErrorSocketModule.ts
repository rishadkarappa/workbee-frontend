import { Socket } from 'socket.io-client';
import { ChatSocketConnection } from '../connection/ChatSocketConnection';

export class ErrorSocketModule {
  private errorCallbacks: Set<(data: { message: string }) => void> = new Set();

  private connection: ChatSocketConnection;
    constructor(connection: ChatSocketConnection) {
        this.connection = connection;
        this.connection.registerAttacher((socket) => this.reattach(socket))
    }

  private reattach(socket: Socket): void {
    this.errorCallbacks.forEach(cb => {
      socket.off('error', cb);
      socket.on('error', cb);
    });
  }

  onSocketError(callback: (data: { message: string }) => void): void {
    this.errorCallbacks.add(callback);
    const socket = this.connection.getSocket();
    if (socket) {
      socket.off('error', callback);
      socket.on('error', callback);
    }
  }

  offSocketError(callback?: (data: { message: string }) => void): void {
    const socket = this.connection.getSocket();
    if (callback) {
      this.errorCallbacks.delete(callback);
      socket?.off('error', callback);
    } else {
      this.errorCallbacks.forEach(cb => socket?.off('error', cb));
      this.errorCallbacks.clear();
    }
  }

  clear(): void {
    this.errorCallbacks.clear();
  }
}