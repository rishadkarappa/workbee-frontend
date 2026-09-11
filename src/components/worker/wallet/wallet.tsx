import { useEffect, useState } from "react";
import {
  Wallet,
  Clock,
  TrendingUp,
  IndianRupee,
  ArrowDownCircle,
  CheckCircle2,
  RefreshCw,
  Banknote,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PaymentService } from "@/services/payment-service";
import { getErrorMessage } from "@/utils/error-helper";

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
function txMeta(type: string) {
  switch (type) {
    case "hold":
      return {
        label: "Payment received — held",
        sublabel: "Will be released 1 hour after work completion",
        icon: <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
        bg: "bg-amber-50 dark:bg-amber-950/40",
        amountColor: "text-amber-600 dark:text-amber-400",
        sign: "+",
      };
    case "credit":
      return {
        label: "Payment credited to wallet",
        sublabel: "Available to withdraw",
        icon: <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />,
        bg: "bg-green-50 dark:bg-green-950/40",
        amountColor: "text-green-600 dark:text-green-400",
        sign: "+",
      };
    case "platform_fee":
      return {
        label: "Platform fee (1%)",
        sublabel: "WorkBee service charge",
        icon: <IndianRupee className="w-5 h-5 text-muted-foreground" />,
        bg: "bg-muted",
        amountColor: "text-muted-foreground",
        sign: "−",
      };
    case "refund":
      return {
        label: "Refund issued",
        sublabel: "",
        icon: <RefreshCw className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
        bg: "bg-blue-50 dark:bg-blue-950/40",
        amountColor: "text-blue-600 dark:text-blue-400",
        sign: "+",
      };
    default:
      return {
        label: type,
        sublabel: "",
        icon: <ArrowDownCircle className="w-5 h-5 text-muted-foreground" />,
        bg: "bg-muted",
        amountColor: "text-foreground",
        sign: "+",
      };
  }
}

function WorkerTransactionRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const meta = txMeta(tx.type);

  // Don't show platform_fee rows to worker — they're internal audit records
  if (tx.type === "platform_fee") return null;

  const isPending = tx.status === "pending";

  return (
    <div className={`border rounded-xl overflow-hidden ${isPending ? "border-amber-200 dark:border-amber-900" : "border-border"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{meta.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
              </p>
              {isPending && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
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
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{tx.status}</p>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 bg-muted/30 border-t space-y-3">
          <div className="pt-3">
            <p className="text-xs text-foreground/80">{tx.description}</p>
          </div>

          {tx.metadata?.totalAmount && (
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Payment Breakdown
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Client paid</span>
                <span className="font-medium text-foreground">{formatAmount(tx.metadata.totalAmount)}</span>
              </div>
              {tx.metadata.platformFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee (1%)</span>
                  <span className="text-muted-foreground">−{formatAmount(tx.metadata.platformFee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Your earnings</span>
                <span className="text-green-600 dark:text-green-400">{formatAmount(tx.amount)}</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Transaction ID
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate">{tx.id}</p>
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
      // console.log("wallet resp", res.data);
      setWallet(res.data.data);
      setTransactions(res.data.data.transactions || []);
    } catch (err) {
      setError(getErrorMessage(err));
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
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <Button variant="outline" onClick={fetchWallet}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full max-w-6xl mx-auto">

      {/* Balance Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          data-slot="card"
          className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
        >
          <CardHeader>
            <CardDescription>Withdrawable</CardDescription>

            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(wallet?.balance ?? 0)}
            </CardTitle>

            <CardAction>
              <div className="rounded-md bg-muted p-2">
                <Banknote className="size-4 text-muted-foreground" />
              </div>
            </CardAction>
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Available now
            </div>
          </CardFooter>
        </Card>

        <Card
          data-slot="card"
          className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
        >
          <CardHeader>
            <CardDescription>Pending</CardDescription>

            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(wallet?.pendingBalance ?? 0)}
            </CardTitle>

            <CardAction>
              <div className="rounded-md bg-muted p-2">
                <Clock className="size-4 text-muted-foreground" />
              </div>
            </CardAction>
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {pendingCount} work{pendingCount !== 1 ? "s" : ""} in progress
            </div>
          </CardFooter>
        </Card>

        <Card
          data-slot="card"
          className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
        >
          <CardHeader>
            <CardDescription>Total Earned</CardDescription>

            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(wallet?.totalEarned ?? 0)}
            </CardTitle>

            <CardAction>
              <div className="rounded-md bg-muted p-2">
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
            </CardAction>
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              After 1% platform fee
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Pending payout info banner */}
      {pendingCount > 0 && (
        <div className="rounded-xl border bg-muted/50 px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <p className="font-medium">
              {formatAmount(pendingAmount)} is held for{" "}
              {pendingCount} active work{pendingCount > 1 ? "s" : ""}
            </p>
            <p className="text-muted-foreground mt-0.5">
              Funds are released 1 hour after you mark work as completed.
              A 1% platform fee is deducted before crediting your wallet.
            </p>
          </div>
        </div>
      )}

      {/* refresh button */}
      <Button variant="outline" size="sm" onClick={fetchWallet}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>

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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${filter === f
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
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
              <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
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