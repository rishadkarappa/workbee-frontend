import { api } from './axios-instance';

export const ChatService = {
  createChat: (data: { userId: string; workerId: string }) => {
    return api.post('/communication/chat/create', data);
  },

  getMyChats: () => {
    return api.get('/communication/chat/my-chats');
  },

  getMessages: (chatId: string, limit?: number, offset?: number) => {
    return api.get(`/communication/chat/${chatId}/messages`, {
      params: { limit, offset },
    });
  },

  markChatAsRead: (chatId: string) => {
    return api.patch(`/communication/chat/${chatId}/read`);
  },

  /**
   * Upload an image or video file to Cloudinary via the backend.
   * Returns { url, publicId, resourceType, ... }
   */
  uploadChatMedia: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/communication/upload/chat-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
  },
};