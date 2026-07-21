
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  senderDetails?: { name: string; avatar?: string };
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  mediaUrl?: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: { userId: string; workerId: string };
  participantDetails?: {
    user?: { id: string; name: string; avatar?: string };
    worker?: { id: string; name: string; avatar?: string };
  };
  lastMessage?: string;
  lastMessageAt?: string;
  myUnreadCount?: number;
}
