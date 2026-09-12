import { PAYMENT_ENDPOINTS } from "@/constants/api-endpoints/payment-endpoints";
import { api } from "./axios-instance/axios-instance";

export interface WalletQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const PaymentService = {
  createOrder: (data: { workId: string; workerId: string; workTitle: string; amount: number; }) => {
    return api.post(PAYMENT_ENDPOINTS.CREATE_ORDER, data);
  },

  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; }) => {
    return api.post(PAYMENT_ENDPOINTS.VERIFY_PAYMENT, data);
  },

  // Records a failed/cancelled/undeliverable payment attempt so it shows up in the wallet.
  notifyPaymentFailed: (data: { razorpayOrderId: string; reason?: string }) => {
    return api.post(PAYMENT_ENDPOINTS.PAYMENT_FAILED, data);
  },

  notifyWorkCompleted: (workId: string) => {
    return api.post(PAYMENT_ENDPOINTS.WORK_COMPLETED, { workId });
  },

  // getMyWallet: () => {
  //   return api.get(PAYMENT_ENDPOINTS.WALLET);
  // },
  getMyWallet: (params?: WalletQueryParams) => {
    return api.get(PAYMENT_ENDPOINTS.WALLET, { params });
  },

  getAdminSummary: () => {
    return api.get(PAYMENT_ENDPOINTS.ADMIN.SUMMARY);
  },

  getAdminPaymentsList: (page = 1, limit = 15,
    filters?: { status?: string; startDate?: string; endDate?: string; }
  ) => {
    return api.get(PAYMENT_ENDPOINTS.ADMIN.PAYMENTS, {
      params: { page, limit, ...filters, },
    });
  },

  getWorkerEarningsStats: () => {
    return api.get(PAYMENT_ENDPOINTS.WORKER_EARNINGS_STATS);
  },

  getAdminPaymentStats: () => {
    return api.get(PAYMENT_ENDPOINTS.ADMIN.PAYMENT_STATS);
  },
};