import { COMMUNICAION_ENDPOINTS } from '@/constants/api-endpoints/communication-endpoints';
import { api } from './axios-instance/axios-instance';

export const ChatService = {
  createChat: (data: { userId: string; workerId: string }) => {
    return api.post(COMMUNICAION_ENDPOINTS.CHAT.CREATE, data);
  },

  getMyChats: () => {
    return api.get(COMMUNICAION_ENDPOINTS.CHAT.MY_CHATS);
  },

  getMessages: (chatId: string, limit?: number, offset?: number) => {
    return api.get(COMMUNICAION_ENDPOINTS.CHAT.GET_MESSAGES(chatId), {
      params: { limit, offset },
    });
  },

  markChatAsRead: (chatId: string) => {
    return api.patch(COMMUNICAION_ENDPOINTS.CHAT.MARK_AS_READ(chatId));
  },

  /**
   * Upload an image or video file to Cloudinary direct upload in cloudinary signed url .
   * only send to backend that signed url
   */
  
  getUploadSignature: (resourceType: 'image' | 'video') => {
    return api.get(COMMUNICAION_ENDPOINTS.CHAT.UPLOAD_SIGNATURE(resourceType));
  },
};