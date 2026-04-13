import { useEffect, useState } from "react";
import {
  Wallet,
  Clock,
  TrendingUp,
  IndianRupee,
  ArrowDownCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Banknote,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PaymentService } from "@/services/payment-service";

interface WalletData {
  id: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
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
    platformFee?: number;
    totalAmount?: number;
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

// Map transaction type to human-readable label + icon + color
function txMeta(type: string, status: string) {
  switch (type) {
    case "hold":
      return {
        label: "Payment received — held",
        sublabel: "Will be released 1 hour after work completion",
        icon: <Clock className="w-5 h-5 text-amber-500" />,
        bg: "bg-amber-50",
        amountColor: "text-amber-600",
        sign: "+",
      };
    case "credit":
      return {
        label: "Payment credited to wallet",
        sublabel: "Available to withdraw",
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        bg: "bg-green-50",
        amountColor: "text-green-600",
        sign: "+",
      };
    case "platform_fee":
      return {
        label: "Platform fee (1%)",
        sublabel: "WorkBee service charge",
        icon: <IndianRupee className="w-5 h-5 text-gray-400" />,
        bg: "bg-gray-50",
        amountColor: "text-gray-500",
        sign: "−",
      };
    case "refund":
      return {
        label: "Refund issued",
        sublabel: "",
        icon: <RefreshCw className="w-5 h-5 text-blue-500" />,
        bg: "bg-blue-50",
        amountColor: "text-blue-600",
        sign: "+",
      };
    default:
      return {
        label: type,
        sublabel: "",
        icon: <ArrowDownCircle className="w-5 h-5 text-gray-400" />,
        bg: "bg-gray-50",
        amountColor: "text-gray-700",
        sign: "+",
      };
  }
}

function WorkerTransactionRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const meta = txMeta(tx.type, tx.status);

  // Don't show platform_fee rows to worker — they're internal audit records
  if (tx.type === "platform_fee") return null;

  const isPending = tx.status === "pending";

  return (
    <div className={`border rounded-xl overflow-hidden ${isPending ? "border-amber-200" : "border-gray-200"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{meta.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
              </p>
              {isPending && (
                <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meta.sublabel}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <div className="text-right">
              <p className={`text-sm font-semibold ${meta.amountColor}`}>
                {meta.sign}
                {formatAmount(tx.amount)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{tx.status}</p>
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
        <div className="px-4 pb-4 bg-gray-50 border-t space-y-3">
          <div className="pt-3">
            <p className="text-xs text-gray-700">{tx.description}</p>
          </div>

          {tx.metadata?.totalAmount && (
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Payment Breakdown
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Client paid</span>
                <span className="font-medium">{formatAmount(tx.metadata.totalAmount)}</span>
              </div>
              {tx.metadata.platformFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform fee (1%)</span>
                  <span className="text-gray-500">−{formatAmount(tx.metadata.platformFee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Your earnings</span>
                <span className="text-green-600">{formatAmount(tx.amount)}</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Transaction ID
            </p>
            <p className="text-xs text-gray-600 font-mono truncate">{tx.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkerWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

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

  // Filter out platform_fee from worker view, apply status filter
  const visible = transactions.filter((t) => t.type !== "platform_fee");
  const filtered =
    filter === "all"
      ? visible
      : visible.filter((t) => t.status === filter);

  const pendingAmount = transactions
    .filter((t) => t.type === "hold" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = transactions.filter(
    (t) => t.type === "hold" && t.status === "pending"
  ).length;

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
        <Button variant="outline" onClick={fetchWallet}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            My Wallet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Earnings, pending payouts, and work history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWallet}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Withdrawable
              </p>
              <Banknote className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">
              {formatAmount(wallet?.balance ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Available now</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                Pending
              </p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {formatAmount(wallet?.pendingBalance ?? 0)}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {pendingCount} work{pendingCount !== 1 ? "s" : ""} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Earned
              </p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatAmount(wallet?.totalEarned ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">After 1% platform fee</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending payout info banner */}
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">
              {formatAmount(pendingAmount)} is held for{" "}
              {pendingCount} active work{pendingCount > 1 ? "s" : ""}
            </p>
            <p className="text-amber-700 mt-0.5">
              Funds are released 1 hour after you mark work as completed.
              A 1% platform fee is deducted before crediting your wallet.
            </p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">
              Earnings History
            </CardTitle>
            <div className="flex gap-1.5">
              {(["all", "pending", "completed"] as const).map((f) => (
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
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filter === "all"
                  ? "No earnings yet. Complete work to receive payments."
                  : `No ${filter} earnings.`}
              </p>
            </div>
          ) : (
            filtered.map((tx) => (
              <WorkerTransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}