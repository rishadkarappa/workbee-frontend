import { SocketConnection } from "../connection/socket-connection";

export class BidSocketModule {
    private connection: SocketConnection;
    constructor(connection: SocketConnection) {
        this.connection = connection;
    }


    async sendBidOffer(data: {
        chatId: string; workId: string; workTitle: string; userId: string;
        workerId: string; workerName: string; amount: number; offeredBy: 'user' | 'worker';
    }): Promise<void> {
        try {
            await this.connection.emitEnsured('send_bid_offer', data);
        } catch (err) {
            console.error('[Socket] sendBidOffer failed:', err);
            throw err;
        }
    }

    async respondToBid(data: {
        bidId: string; respondedBy: 'user' | 'worker'; action: 'accept' | 'reject';
    }): Promise<void> {
        try {
            await this.connection.emitEnsured('respond_bid', data);
        } catch (err) {
            console.error('[Socket] respondToBid failed:', err);
            throw err;
        }
    }

    async notifyBidPaymentCompleted(data: {
        chatId: string; bidId: string; workId: string; workTitle: string;
        userId: string; workerId: string; workerName: string; amount: number;
    }): Promise<void> {
        try {
            await this.connection.emitEnsured('bid_payment_completed', data);
        } catch (err) {
            console.error('[Socket] notifyBidPaymentCompleted failed:', err);
            throw err;
        }
    }
}