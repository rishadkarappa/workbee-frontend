export const COMMUNICAION_ENDPOINTS = {
    CHAT: {
        CREATE: "/communication/chat/create",
        MY_CHATS: "/communication/chat/my-chats",
        GET_MESSAGES: (chatId: string) => `/communication/chat/${chatId}/messages`,
        MARK_AS_READ: (chatId: string) => `/communication/chat/${chatId}/read`,
        UPLOAD_MEDIA: "/communication/upload/chat-media",
    },
}