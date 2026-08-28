import { PAYMENT_ENDPOINTS } from "@/constants/api-endpoints/payment-endpoints";
import { api } from "./axios-instance/axios-instance";

export const PaymentService = {
  // Create Razorpay order
  createOrder: (data: { workId: string; workerId: string; workTitle: string; amount: number; }) => {
    return api.post(PAYMENT_ENDPOINTS.CREATE_ORDER, data);
  },

  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; }) => {
    return api.post(PAYMENT_ENDPOINTS.VERIFY_PAYMENT, data);
  },

  // Triggers the 1-hour delayed payout to the worker's wallet.
  notifyWorkCompleted: (workId: string) => {
    return api.post(PAYMENT_ENDPOINTS.WORK_COMPLETED, { workId });
  },

  // Get wallet for current user or worker
  getMyWallet: () => {
    return api.get(PAYMENT_ENDPOINTS.WALLET);
  },

  // Admin: get payment summary
  getAdminSummary: () => {
    return api.get(PAYMENT_ENDPOINTS.ADMIN.SUMMARY);
  },

  // Admin: get paginated list of all payment records with full details
  getAdminPaymentsList: (page = 1, limit = 15) => {
    return api.get(PAYMENT_ENDPOINTS.ADMIN.PAYMENTS, { params: { page, limit } });
  },

  // dashboard
  getWorkerEarningsStats: () => {
    return api.get(PAYMENT_ENDPOINTS.WORKER_EARNINGS_STATS);
  },
};