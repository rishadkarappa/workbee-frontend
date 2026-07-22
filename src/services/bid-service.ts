import { socketService } from './socket-service';

export const BidService = {
  sendWorkerOffer: (data: {
    chatId: string;
    workId: string;
    workTitle: string;
    userId: string;
    workerId: string;
    workerName: string;
    amount: number;
  }) => socketService.sendBidOffer({ ...data, offeredBy: 'worker' }),

  sendClientCounterOffer: (data: {
    chatId: string;
    workId: string;
    workTitle: string;
    userId: string;
    workerId: string;
    workerName: string;
    amount: number;
  }) => socketService.sendBidOffer({ ...data, offeredBy: 'user' }),

  respondToBid: (data: { bidId: string; respondedBy: 'user' | 'worker'; action: 'accept' | 'reject' }) =>
    socketService.respondToBid(data),

  notifyPaymentCompleted: (data: {
    chatId: string;
    bidId: string;
    workId: string;
    workTitle: string;
    userId: string;
    workerId: string;
    workerName: string;
    amount: number;
  }) => socketService.notifyBidPaymentCompleted(data),
};
