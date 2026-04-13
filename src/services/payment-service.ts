import { api } from "./axios-instance";

export const PaymentService = {
  // Create Razorpay order — called when user clicks Confirm on a deal
  createOrder: (data: {
    workId:    string;
    workerId:  string;
    workTitle: string;
    amount:    number;
  }) => {
    return api.post("/payment/create-order", data);
  },

  // Verify payment after Razorpay popup succeeds
  verifyPayment: (data: {
    razorpayOrderId:   string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    return api.post("/payment/verify", data);
  },

  // Get wallet for current user or worker
  getMyWallet: () => {
    return api.get("/payment/wallet");
  },

  // Admin: get payment summary (totals)
  getAdminSummary: () => {
    return api.get("/payment/admin/summary");
  },

  // Admin: get paginated list of all payment records with full details
  getAdminPaymentsList: (page = 1, limit = 15) => {
    return api.get(`/payment/admin/payments?page=${page}&limit=${limit}`);
  },
};