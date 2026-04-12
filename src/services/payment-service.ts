// src/services/payment-service.ts  (Razorpay version)

import { api } from "./axios-instance";

export const PaymentService = {
  // Create Razorpay order — called when user clicks Confirm on a deal
  // Returns: { orderId, amount (paise), currency, keyId }
  createOrder: (data: {
    workId:    string;
    workerId:  string;
    workTitle: string;
    amount:    number; // whole rupees
  }) => {
    return api.post("/payment/create-order", data);
  },

  // Verify payment after Razorpay popup succeeds
  // Called client-side with the three values Razorpay returns in handler()
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

  // Admin: get payment summary
  getAdminSummary: () => {
    return api.get("/payment/admin/summary");
  },
};