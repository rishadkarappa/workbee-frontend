export const NOTIFICATION_ENDPOINTS = {
    GET_ALL: "/notification/notifications",
    UNREAD_COUNT: "/notification/notifications/unread-count",
    MARK_AS_READ: (id: string) => `/notification/notifications/${id}/read`,
    MARK_ALL_READ: "/notification/notifications/mark-all-read",
}