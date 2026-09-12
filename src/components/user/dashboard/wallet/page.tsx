import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
          <RefreshCw className="w-3 h-3" />
          Refunded
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
          {status}
        </span>
      );
  }
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const isDebit = tx.type === "payment";
  const label =
    tx.type === "payment" ? "Payment for work" :
    tx.type === "hold" ? "Amount held" :
    tx.type === "credit" ? "Payment received" :
    tx.type === "refund" ? "Refund" : tx.type;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted">
              {isDebit ? <ArrowUpCircle className="h-5 w-5 text-muted-foreground" /> : <ArrowDownCircle className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
              </p>
            </div>
          </div>
          <div className="ml-4 flex flex-shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {isDebit ? "−" : "+"}
                {formatAmount(tx.amount)}
              </p>
              <div className="mt-0.5 flex justify-end">
                <StatusBadge status={tx.status} />
              </div>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 bg-muted/40 border-t border-border space-y-2">
          {tx.description && (
            <div className="pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-foreground/80">{tx.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Transaction ID</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{tx.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Currency</p>
              <p className="text-xs text-muted-foreground">{tx.currency}</p>
            </div>
            {tx.metadata?.razorpayPaymentId && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Razorpay Payment ID</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{tx.metadata.razorpayPaymentId}</p>
              </div>
            )}
            {tx.metadata?.razorpayOrderId && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Razorpay Order ID</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{tx.metadata.razorpayOrderId}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserWallet() {
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [dateMode, setDateMode] = useState<DateFilterMode>("range");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);

  const hasActiveDateFilter = dateMode === "single" ? !!singleDate : !!(dateRange?.from && dateRange?.to);

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

  // Page-scoped counts (accurate summary counters need dedicated endpoints/aggregates —
  // see note below the code)
  const successCount = transactions.filter((t) => t.type === "payment" && t.status === "completed").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const failedCount = transactions.filter((t) => t.status === "failed").length;

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(wallet?.totalSpent ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Lifetime payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful (this page)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successCount}</div>
            <p className="text-xs text-muted-foreground">Payments completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending (this page)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
            <div className="flex gap-1.5">
              {(["all", "completed", "pending", "failed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
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
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {statusFilter === "all" && !hasActiveDateFilter
                  ? "No transactions yet. Make your first payment to get started."
                  : "No transactions match the selected filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
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

      {/* {failedCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            You have {failedCount} failed transaction{failedCount > 1 ? "s" : ""} on this page. If money was deducted, it will be
            auto-refunded within 5–7 business days.
          </p>
        </div>
      )} */}

    </div>
  );
}