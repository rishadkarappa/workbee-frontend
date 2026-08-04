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
            HOME: "/user-dashboard",
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
            HOME: "/worker/worker-dashboard",
            
        },
    },

} as const;