import { api } from "./axios-instance/axios-instance";

export const PaymentService = {
  // Create Razorpay order
  createOrder: (data: { workId: string; workerId: string; workTitle: string; amount: number; }) => {
    // return api.post("/payment/create-order", data);
    return api.post("/payment/create-orders", data);
  },

  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; }) => {
    return api.post("/payment/verify", data);
  },

  // Triggers the 1-hour delayed payout to the worker's wallet.
  notifyWorkCompleted: (workId: string) => {
    return api.post("/payment/work-completed", { workId });
  },

  // Get wallet for current user or worker
  getMyWallet: () => {
    return api.get("/payment/wallet");
  },

  // Admin: get payment summary
  getAdminSummary: () => {
    return api.get("/payment/admin/summary");
  },

  // Admin: get paginated list of all payment records with full details
  getAdminPaymentsList: (page = 1, limit = 15) => {
    return api.get(`/payment/admin/payments?page=${page}&limit=${limit}`);
  },
};