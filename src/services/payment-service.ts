import { api } from "./axios-instance";

export const PaymentService = {
  // Create Stripe checkout session — user calls this when they click Confirm
  createCheckoutSession: (data: {
    workId:    string;
    workerId:  string;
    workTitle: string;
    amount:    number;
  }) => {
    return api.post("/payment/create-checkout-session", data);
  },

  // Get wallet for current user or worker
  getMyWallet: () => {
    return api.get("/payment/wallet");
  },

  // Admin: get payment summary
  getAdminSummary: () => {
    return api.get("/payment/admin/summary");
  },
};