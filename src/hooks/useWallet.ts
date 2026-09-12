import { useCallback, useEffect, useState } from "react";
import { PaymentService } from "@/services/payment-service";
import { getErrorMessage } from "@/utils/error-helper";

export interface WalletData {
  id: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  metadata?: {
    platformFee?: number;
    totalAmount?: number;
    workId?: string;
    workerId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseWalletParams {
  page: number;
  limit: number;
  status?: string;   // "all" | specific status
  startDate?: string;
  endDate?: string;
}

const emptyPagination = (page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  total: 0,
  totalPages: 1,
});

export function useWallet({ page, limit, status, startDate, endDate }: UseWalletParams) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination(page, limit));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await PaymentService.getMyWallet({
        page,
        limit,
        status: status && status !== "all" ? status : undefined,
        startDate,
        endDate,
      });

      const data = res.data.data;
      setWallet(data);
      setTransactions(data.transactions || []);
      setPagination(data.pagination ?? emptyPagination(page, limit));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, startDate, endDate]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { wallet, transactions, pagination, loading, error, refetch: fetchWallet };
}