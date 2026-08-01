import { Socket } from 'socket.io-client';
import { ChatSocketConnection } from '../connection/ChatSocketConnection';
import type { IncomingSocketMessage, SendMessageData } from '../types/SocketType';

export class ChatSocketModule {
    private connection: ChatSocketConnection;
    private messageCallbacks: Set<(message: IncomingSocketMessage) => void> = new Set();

    constructor(connection: ChatSocketConnection) {
        this.connection = connection;
        this.connection.registerAttacher((socket) => this.reattach(socket));
    }

    private reattach(socket: Socket): void {
        this.messageCallbacks.forEach(cb => {
            socket.off('new_message', cb);
            socket.on('new_message', cb);
        });
    }

    joinChat(chatId: string): void {
        this.connection.joinChat(chatId);
    }

    leaveChat(chatId: string): void {
        this.connection.leaveChat(chatId);
    }

    async sendMessage(data: SendMessageData): Promise<void> {
        try {
            await this.connection.emitEnsured('send_message', data);
        } catch (err) {
            console.error('[Socket] sendMessage failed — could not reconnect:', err);
            throw err;
        }
    }

    onNewMessage(callback: (message: IncomingSocketMessage) => void): void {
        this.messageCallbacks.add(callback);
        const socket = this.connection.getSocket();
        if (socket) {
            socket.off('new_message', callback);
            socket.on('new_message', callback);
        }
    }

    offNewMessage(callback?: (message: IncomingSocketMessage) => void): void {
        const socket = this.connection.getSocket();
        if (callback) {
            this.messageCallbacks.delete(callback);
            socket?.off('new_message', callback);
        } else {
            this.messageCallbacks.forEach(cb => socket?.off('new_message', cb));
            this.messageCallbacks.clear();
        }
    }

    clear(): void {
        this.messageCallbacks.clear();
    }
}