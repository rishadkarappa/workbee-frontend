import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PaymentService } from "@/services/payment-service";

interface WalletData {
  id: string;
  balance: number;
  pendingBalance: number;
  totalSpent: number;
  totalEarned: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  metadata?: {
    workId?: string;
    workerId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3 h-3" />
          Refunded
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          {status}
        </span>
      );
  }
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);

  const isDebit = tx.type === "payment";
  const label =
    tx.type === "payment"
      ? "Payment for work"
      : tx.type === "hold"
      ? "Amount held"
      : tx.type === "credit"
      ? "Payment received"
      : tx.type === "refund"
      ? "Refund"
      : tx.type;

  const shortDesc =
    tx.description?.length > 50
      ? tx.description.substring(0, 50) + "…"
      : tx.description;

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDebit ? "bg-red-50" : "bg-green-50"
              }`}
            >
              {isDebit ? (
                <ArrowUpCircle className="w-5 h-5 text-red-500" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  isDebit ? "text-red-600" : "text-green-600"
                }`}
              >
                {isDebit ? "−" : "+"}
                {formatAmount(tx.amount)}
              </p>
              <div className="mt-0.5 flex justify-end">
                <StatusBadge status={tx.status} />
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t space-y-2">
          {tx.description && (
            <div className="pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700">{tx.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Transaction ID
              </p>
              <p className="text-xs text-gray-600 font-mono truncate">{tx.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Currency
              </p>
              <p className="text-xs text-gray-600">{tx.currency}</p>
            </div>
            {tx.metadata?.razorpayPaymentId && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Razorpay Payment ID
                </p>
                <p className="text-xs text-gray-600 font-mono truncate">
                  {tx.metadata.razorpayPaymentId}
                </p>
              </div>
            )}
            {tx.metadata?.razorpayOrderId && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Razorpay Order ID
                </p>
                <p className="text-xs text-gray-600 font-mono truncate">
                  {tx.metadata.razorpayOrderId}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PaymentService.getMyWallet();
      setWallet(res.data.data.wallet);
      setTransactions(res.data.data.transactions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  const successCount = transactions.filter(
    (t) => t.type === "payment" && t.status === "completed"
  ).length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const failedCount = transactions.filter((t) => t.status === "failed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={fetchWallet}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
      <div className="space-y-6 p-4 sm:p-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            My Wallet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Payment history and spending overview
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWallet}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Total Spent
              </p>
              <CreditCard className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">
              {formatAmount(wallet?.totalSpent ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Lifetime payments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Successful
              </p>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-gray-500 mt-1">Payments completed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pending
              </p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">
              Transaction History
            </CardTitle>
            {/* Filter Pills */}
            <div className="flex gap-1.5">
              {(["all", "completed", "pending", "failed"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                      filter === f
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f}
                  </button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filter === "all"
                  ? "No transactions yet. Make your first payment to get started."
                  : `No ${filter} transactions.`}
              </p>
            </div>
          ) : (
            filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </CardContent>
      </Card>

      {failedCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            You have {failedCount} failed transaction
            {failedCount > 1 ? "s" : ""}. If money was deducted, it will be
            auto-refunded within 5–7 business days.
          </p>
        </div>
      )}
    </div>
  );
}