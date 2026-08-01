import type { Message } from "@/components/worker/messages/types/messages.types";

export interface SendMessageData {
    chatId: string;
    content: string;
    type?: string;
    recipientId?: string;
    mediaUrl?: string;
    mediaPublicId?: string;
}

export type IncomingSocketMessage = Message & { chatId: string };
