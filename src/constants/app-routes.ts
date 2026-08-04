export const AppRoutes = {
  USER: {
    LOGIN: "login",
    REGISTER: "register",
    OTP: "otp",
    FORGOT_PASSWORD: "forgot-password",
    RESET_PASSWORD: "reset-password/:token",
    TASK_BOOKING: "task-booking",
    DASHBOARD: "user-dashboard",
    WORKS: "works",
    ACTIVE_WORKS: "active-works",
    MESSAGES: "messages",
    WALLET: "user-wallet",
  },
  
  ADMIN: {
    DASHBOARD: "dashboard",
    USERS: "users",
    WORKERS: "workers",
    NEW_APPLIERS: "new-appliers",
    PAYMENTS: "payments",
  },

  WORKER: {
    LOGIN: "worker-login",
    APPLY: "apply-worker",
    DASHBOARD: "worker-dashboard",
    WORKS: "works",
    ACTIVE_WORKS: "active-works",
    MESSAGES: "client-messages",
    WALLET: "wallet",
  },

} as const;