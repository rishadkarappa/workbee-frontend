export const AppRoutes = {
    HOME: "/",
    USER_ROUTES: {
        LOGIN: "login",
        REGISTER: "register",
        OTP: "otp",
        FORGOT_PASSWORD: "forgot-password",
        RESET_PASSWORD: "/reset-password/:token",

        TASK_BOOKING: "/task-booking",

        DASHBOARD: "/user-dashboard",
        DASHBOARD_HOME: "/user-dashboard",
        MY_WORKS: "/user-dashboard/works",
        ACTIVE_WORKS: "/user-dashboard/active-works",
        MESSAGES: "/user-dashboard/messages",
        WALLET: "/user-dashboard/user-wallet",
    },

    ADMIN: {
        LOGIN: "/",
        DASHBOARD: "/dashboard",

        USERS: "/dashboard/users",
        WORKERS: "/dashboard/workers",
        NEW_APPLIERS: "/dashboard/new-appliers",
        PAYMENTS: "/dashboard/payments",
    },

    WORKER: {
        LOGIN: "/worker-login",
        APPLY: "/apply-worker",

        DASHBOARD: "/worker-dashboard",
        WORKS: "/worker-dashboard/works",
        ACTIVE_WORKS: "/worker-dashboard/active-works",
        CLIENT_MESSAGES: "/worker-dashboard/client-messages",
        WALLET: "/worker-dashboard/wallet",
    },
}