
import { api } from "./axios-instance";

export const ChatService = {
  createChat: (data: { userId: string; workerId: string }) => {
    return api.post("/communication/chat/create", data);
  },

  getMyChats: () => {
    return api.get("/communication/chat/my-chats");
  },

  getMessages: (chatId: string, limit?: number, offset?: number) => {
    return api.get(`/communication/chat/${chatId}/messages`, {
      params: { limit, offset }
    });
  },

  markChatAsRead: (chatId: string) => {
    return api.patch(`/communication/chat/${chatId}/read`);
  }
};
