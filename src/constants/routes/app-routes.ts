export const AppRoutes = {
    USER: {
        HOME: "/",
        LOGIN: "/login",
        REGISTER: "/register",
        OTP: "/otp",
        FORGOT_PASSWORD: "/forgot-password",
        RESET_PASSWORD: (token: string) => `/reset-password/${token}`,
        TASK_BOOKING: "/task-booking",

        DASHBOARD: {
            DASH: "/user-dashboard",
            MESSAGES: "/user-dashboard/messages",
            MY_WORKS: "user-dashboard/works"
        },
    },

    ADMIN: {
        LOGIN: "/admin",
        DASHBOARD: {
            DASH: "/admin/dashboard",
        },
        
    },

    WORKER: {
        LOGIN: "/worker/worker-login",
        APPLY: "/worker/apply-worker",
        DASHBOARD: {
            DASH: "/worker/worker-dashboard",
            CLIENT_MESSAGES:"/worker/worker-dashboard/client-messages",
        },
    },

} as const;