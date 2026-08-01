import { Socket } from 'socket.io-client';
import { ChatSocketConnection } from '../connection/ChatSocketConnection';

export class WorkSocketModule {
  private progressCallbacks: Set<(data: { workId: string; progress: string }) => void> = new Set();

  private connection: ChatSocketConnection;
    constructor(connection: ChatSocketConnection) {
        this.connection = connection;
        this.connection.registerAttacher((socket) => this.reattach(socket))
    }
  private reattach(socket: Socket): void {
    this.progressCallbacks.forEach(cb => {
      socket.off('work_progress_changed', cb);
      socket.on('work_progress_changed', cb);
    });
  }

  async askForConfirm(data: {
    chatId: string; workId: string; workTitle: string;
    workerId: string; workerName: string; userId: string;
  }): Promise<void> {
    try {
      await this.connection.emitEnsured('ask_for_confirm', data);
    } catch (err) {
      console.error('[Socket] askForConfirm failed:', err);
      throw err;
    }
  }

  async confirmResponse(data: {
    chatId: string; workId: string; workTitle: string; accepted: boolean;
    userId: string; workerName: string; workerId: string;
  }): Promise<void> {
    try {
      await this.connection.emitEnsured('confirm_response', data);
    } catch (err) {
      console.error('[Socket] confirmResponse failed:', err);
      throw err;
    }
  }

  async updateWorkProgress(data: {
    chatId: string; workId: string; workTitle: string; progress: string; workerId: string;
  }): Promise<void> {
    try {
      await this.connection.emitEnsured('work_progress_update', data);
    } catch (err) {
      console.error('[Socket] updateWorkProgress failed:', err);
      throw err;
    }
  }

  onWorkProgressChanged(callback: (data: { workId: string; progress: string }) => void): void {
    this.progressCallbacks.add(callback);
    const socket = this.connection.getSocket();
    if (socket) {
      socket.off('work_progress_changed', callback);
      socket.on('work_progress_changed', callback);
    }
  }

  offWorkProgressChanged(callback?: (data: { workId: string; progress: string }) => void): void {
    const socket = this.connection.getSocket();
    if (callback) {
      this.progressCallbacks.delete(callback);
      socket?.off('work_progress_changed', callback);
    } else {
      this.progressCallbacks.forEach(cb => socket?.off('work_progress_changed', cb));
      this.progressCallbacks.clear();
    }
  }

  clear(): void {
    this.progressCallbacks.clear();
  }
}