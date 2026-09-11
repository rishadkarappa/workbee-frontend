import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  startOfDay,
  endOfDay,
  isWithinInterval,
  isSameDay,
  format,
} from "date-fns";
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
  CalendarIcon,
  X,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
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
    <div
      className={`border rounded-xl overflow-hidden ${isPending ? "border-amber-200 dark:border-amber-900" : "border-border"
        }`}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}
            >
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
                <span className="font-medium text-foreground">
                  {formatAmount(tx.metadata.totalAmount)}
                </span>
              </div>
              {tx.metadata.platformFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee (1%)</span>
                  <span className="text-muted-foreground">
                    −{formatAmount(tx.metadata.platformFee)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Your earnings</span>
                <span className="text-green-600 dark:text-green-400">
                  {formatAmount(tx.amount)}
                </span>
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

/* Date filter bar — range mode + single-day mode, sharing one popover     */

type DateFilterMode = "range" | "single";

function DateFilterBar({
  mode,
  onModeChange,
  range,
  onRangeChange,
  single,
  onSingleChange,
  onClear,
  hasActiveFilter,
}: {
  mode: DateFilterMode;
  onModeChange: (m: DateFilterMode) => void;
  range: DateRange | undefined;
  onRangeChange: (r: DateRange | undefined) => void;
  single: Date | undefined;
  onSingleChange: (d: Date | undefined) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
}) {
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    if (mode === "single") {
      return single ? format(single, "d MMM yyyy") : "Pick a date";
    }
    if (range?.from && range?.to) {
      return `${format(range.from, "d MMM yyyy")} – ${format(range.to, "d MMM yyyy")}`;
    }
    if (range?.from) {
      return `${format(range.from, "d MMM yyyy")} – ...`;
    }
    return "Pick a date range";
  }, [mode, range, single]);

  return (
    <div className="flex items-center gap-2">
      {/* Mode toggle */}
      <div className="flex rounded-full bg-muted p-0.5 text-xs font-medium">
        <button
          onClick={() => onModeChange("single")}
          className={cn(
            "px-3 py-1 rounded-full transition-colors",
            mode === "single"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Single Day
        </button>
        <button
          onClick={() => onModeChange("range")}
          className={cn(
            "px-3 py-1 rounded-full transition-colors",
            mode === "range"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Date Range
        </button>
      </div>

      {/* Calendar popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !hasActiveFilter && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={single}
              onSelect={(d) => {
                onSingleChange(d);
                setOpen(false);
              }}
              disabled={(d) => d > new Date()}
            />
          ) : (
            <>
              <Calendar
                mode="range"
                selected={range}
                onSelect={onRangeChange}
                numberOfMonths={2}
                disabled={(d) => d > new Date()}
              />

              <div className="flex justify-end gap-2 border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onRangeChange(undefined);
                  }}
                >
                  Reset
                </Button>

                <Button
                  size="sm"
                  disabled={!range?.from || !range?.to}
                  onClick={() => setOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClear}
          title="Clear date filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Pagination                                                              */
/* ---------------------------------------------------------------------- */

function TxPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  pages.push(1);
  if (page > 3) pages.push("ellipsis");
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/* ---------------------------------------------------------------------- */
/* Main component                                                          */
/* ---------------------------------------------------------------------- */

const PAGE_SIZE = 5;

export default function WorkerWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  const [dateMode, setDateMode] = useState<DateFilterMode>("range");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);

  const [page, setPage] = useState(1);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PaymentService.getMyWallet();
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

  const hasActiveDateFilter =
    dateMode === "single" ? !!singleDate : !!(dateRange?.from && dateRange?.to);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateMode, dateRange, singleDate]);

  // Hide platform_fee rows from worker, then apply status + date filters
  const filteredTransactions = useMemo(() => {
    let list = transactions.filter((t) => t.type !== "platform_fee");

    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    if (dateMode === "single" && singleDate) {
      list = list.filter((t) => isSameDay(new Date(t.createdAt), singleDate));
    } else if (dateMode === "range" && dateRange?.from && dateRange?.to) {
      const start = startOfDay(dateRange.from);
      const end = endOfDay(dateRange.to);
      list = list.filter((t) =>
        isWithinInterval(new Date(t.createdAt), { start, end })
      );
    }

    return list;
  }, [transactions, statusFilter, dateMode, dateRange, singleDate]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const clearDateFilter = () => {
    setDateRange(undefined);
    setSingleDate(undefined);
  };

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
        <Button variant="outline" onClick={fetchWallet}>
          Try Again
        </Button>
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
            <div className="text-muted-foreground">Available now</div>
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
            <div className="text-muted-foreground">After 1% platform fee</div>
          </CardFooter>
        </Card>
      </div>

      {/* Pending payout info banner */}
      {pendingCount > 0 && (
        <div className="rounded-xl border bg-muted/50 px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <p className="font-medium">
              {formatAmount(pendingAmount)} is held for {pendingCount} active work
              {pendingCount > 1 ? "s" : ""}
            </p>
            <p className="text-muted-foreground mt-0.5">
              Funds are released 1 hour after you mark work as completed. A 1% platform
              fee is deducted before crediting your wallet.
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
            <CardTitle className="text-base font-semibold">Earnings History</CardTitle>

            <div className="flex items-center gap-1.5">
              {(["all", "pending", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === f
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Date filter row */}
          <div className="pt-3">
            <DateFilterBar
              mode={dateMode}
              onModeChange={(m) => {
                setDateMode(m);
                // switching modes clears the other mode's selection to avoid confusion
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
          {filteredTransactions.length === 0 ? (
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
                {paginatedTransactions.map((tx) => (
                  <WorkerTransactionRow key={tx.id} tx={tx} />
                ))}
              </div>

              <div className="pt-4 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length}
                </p>
                <TxPagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

