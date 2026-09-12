import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";
import {
  Wallet,
  Clock,
  TrendingUp,
  ArrowDownCircle,
  CheckCircle2,
  RefreshCw,
  Banknote,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DateFilterBar, type DateFilterMode } from "@/components/common/DateFilterBar";
import { TxPagination } from "@/components/common/wallet/TxPagination";
import { useWallet, type Transaction } from "@/hooks/useWallet";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);

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
  const isPending = tx.status === "pending";

  return (
    <div className={`border rounded-xl overflow-hidden ${isPending ? "border-amber-200 dark:border-amber-900" : "border-border"}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
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
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Breakdown</p>
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Transaction ID</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{tx.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkerWallet() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [dateMode, setDateMode] = useState<DateFilterMode>("range");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);

  const hasActiveDateFilter = dateMode === "single" ? !!singleDate : !!(dateRange?.from && dateRange?.to);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateMode, dateRange, singleDate]);

  const { startDate, endDate } = useMemo(() => {
    if (dateMode === "single" && singleDate) {
      return { startDate: startOfDay(singleDate).toISOString(), endDate: endOfDay(singleDate).toISOString() };
    }
    if (dateMode === "range" && dateRange?.from && dateRange?.to) {
      return { startDate: startOfDay(dateRange.from).toISOString(), endDate: endOfDay(dateRange.to).toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateMode, dateRange, singleDate]);

  const { wallet, transactions, pagination, loading, error, refetch } = useWallet({
    page,
    limit: 5,
    status: statusFilter,
    startDate,
    endDate,
  });

  const clearDateFilter = () => {
    setDateRange(undefined);
    setSingleDate(undefined);
  };

  // These summary numbers come from wallet.pendingBalance already; count needs
  // its own lightweight signal — cheapest is to derive it from the current page's
  // pending holds when status filter is "all"/"pending", otherwise fall back to 0.
  const pendingCount = statusFilter !== "completed"
    ? transactions.filter((t) => t.type === "hold" && t.status === "pending").length
    : 0;

  if (loading && !wallet) {
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
        <Button variant="outline" onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card data-slot="card" className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
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
            <div className="text-muted-foreground">Available now</div>
          </CardFooter>
        </Card>

        <Card data-slot="card" className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
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
            <div className="text-muted-foreground">Held until release</div>
          </CardFooter>
        </Card>

        <Card data-slot="card" className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
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
            <div className="text-muted-foreground">After 1% platform fee</div>
          </CardFooter>
        </Card>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl border bg-muted/50 px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <p className="font-medium">
              {pendingCount} active work{pendingCount > 1 ? "s" : ""} on this page has payment held
            </p>
            <p className="text-muted-foreground mt-0.5">
              Funds are released 1 hour after you mark work as completed. A 1% platform fee is deducted before crediting your wallet.
            </p>
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={refetch}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">Earnings History</CardTitle>
            <div className="flex items-center gap-1.5">
              {(["all", "pending", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    statusFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <DateFilterBar
              mode={dateMode}
              onModeChange={(m) => {
                setDateMode(m);
                if (m === "single") setDateRange(undefined);
                else setSingleDate(undefined);
              }}
              range={dateRange}
              onRangeChange={setDateRange}
              single={singleDate}
              onSingleChange={setSingleDate}
              onClear={clearDateFilter}
              hasActiveFilter={hasActiveDateFilter}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {statusFilter === "all" && !hasActiveDateFilter
                  ? "No earnings yet. Complete work to receive payments."
                  : "No earnings match the selected filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <WorkerTransactionRow key={tx.id} tx={tx} />
                ))}
              </div>

              <div className="pt-4 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <TxPagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}