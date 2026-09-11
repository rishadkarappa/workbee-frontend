export const PAYMENT_ENDPOINTS = {
    CREATE_ORDER: "/payment/create-order",
    VERIFY_PAYMENT: "/payment/verify",
    PAYMENT_FAILED: "/payment/payment-failed",
    WORK_COMPLETED: "/payment/work-completed",

    WALLET: "/payment/wallet",

    ADMIN: {
        SUMMARY: "/payment/admin/summary",
        PAYMENTS: "/payment/admin/payments",
        PAYMENT_STATS: "/payment/admin/payment-stats",
    },
    WORKER_EARNINGS_STATS: "/payment/worker/earnings-stats",
};