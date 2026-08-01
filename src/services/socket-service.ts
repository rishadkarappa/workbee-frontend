import { SocketConnection } from './socket/connection/SocketConnection';
import { ChatSocketModule } from './socket/modules/ChatSocketModule';
import type { SendMessageData, IncomingSocketMessage } from './socket/modules/ChatSocketModule';
import { WorkSocketModule } from './socket/modules/WorkSocketModule';
import { BidSocketModule } from './socket/modules/BidSocketModule';;
import { TypingSocketModule } from './socket/modules/TypingSocketModule';;
import { ErrorSocketModule } from './socket/modules/ErrorSocketModule';;


export type { IncomingSocketMessage };

class SocketService {
  private static instance: SocketService;

  private connection = new SocketConnection();
  private chat = new ChatSocketModule(this.connection);
  private work = new WorkSocketModule(this.connection);
  private bid = new BidSocketModule(this.connection);
  private typingModule = new TypingSocketModule(this.connection);
  private errors = new ErrorSocketModule(this.connection);

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) SocketService.instance = new SocketService();
    return SocketService.instance;
  }

  connect(token: string): void { this.connection.connect(token); }
  disconnect(): void {
    this.connection.disconnect();
    this.chat.clear();
    this.work.clear();
    this.typingModule.clear();
    this.errors.clear();
  }
  isConnected(): boolean { return this.connection.isConnected(); }

  joinChat = (chatId: string) => this.chat.joinChat(chatId);
  leaveChat = (chatId: string) => this.chat.leaveChat(chatId);
  sendMessage = (data: SendMessageData) => this.chat.sendMessage(data);
  onNewMessage = (cb: Parameters<ChatSocketModule['onNewMessage']>[0]) => this.chat.onNewMessage(cb);
  offNewMessage = (cb?: Parameters<ChatSocketModule['offNewMessage']>[0]) => this.chat.offNewMessage(cb);

  askForConfirm = (data: Parameters<WorkSocketModule['askForConfirm']>[0]) => this.work.askForConfirm(data);
  confirmResponse = (data: Parameters<WorkSocketModule['confirmResponse']>[0]) => this.work.confirmResponse(data);
  updateWorkProgress = (data: Parameters<WorkSocketModule['updateWorkProgress']>[0]) => this.work.updateWorkProgress(data);
  onWorkProgressChanged = (cb: Parameters<WorkSocketModule['onWorkProgressChanged']>[0]) => this.work.onWorkProgressChanged(cb);
  offWorkProgressChanged = (cb?: Parameters<WorkSocketModule['offWorkProgressChanged']>[0]) => this.work.offWorkProgressChanged(cb);

  sendBidOffer = (data: Parameters<BidSocketModule['sendBidOffer']>[0]) => this.bid.sendBidOffer(data);
  respondToBid = (data: Parameters<BidSocketModule['respondToBid']>[0]) => this.bid.respondToBid(data);
  notifyBidPaymentCompleted = (data: Parameters<BidSocketModule['notifyBidPaymentCompleted']>[0]) => this.bid.notifyBidPaymentCompleted(data);

  sendTyping = (chatId: string, isTyping: boolean) => this.typingModule.sendTyping(chatId, isTyping);
  onUserTyping = (cb: Parameters<TypingSocketModule['onUserTyping']>[0]) => this.typingModule.onUserTyping(cb);
  offUserTyping = (cb?: Parameters<TypingSocketModule['offUserTyping']>[0]) => this.typingModule.offUserTyping(cb);

  onSocketError = (cb: Parameters<ErrorSocketModule['onSocketError']>[0]) => this.errors.onSocketError(cb);
  offSocketError = (cb?: Parameters<ErrorSocketModule['offSocketError']>[0]) => this.errors.offSocketError(cb);
}

export const socketService = SocketService.getInstance();