import { CommunicaionEndPoints } from '@/constants/api-endpoints/communication-endpoints';
import { api } from './axios-instance/axios-instance';

export const ChatService = {
  createChat: (data: { userId: string; workerId: string }) => {
    return api.post(CommunicaionEndPoints.CHAT.CREATE, data);
  },

  getMyChats: () => {
    return api.get(CommunicaionEndPoints.CHAT.MY_CHATS);
  },

  getMessages: (chatId: string, limit?: number, offset?: number) => {
    return api.get(CommunicaionEndPoints.CHAT.GET_MESSAGES(chatId), {
      params: { limit, offset },
    });
  },

  markChatAsRead: (chatId: string) => {
    return api.patch(CommunicaionEndPoints.CHAT.MARK_AS_READ(chatId));
  },

  /**
   * Upload an image or video file to Cloudinary via the backend.
   * Returns { url, publicId, resourceType, ... }
   */
  
  uploadChatMedia: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(CommunicaionEndPoints.CHAT.UPLOAD_MEDIA, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
  },
};