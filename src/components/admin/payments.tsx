import { useEffect, useState, useCallback, Fragment } from "react";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PaymentService } from "@/services/payment-service";
import { getErrorMessage } from "@/utils/error-helper";

interface AdminSummary {
  totalRevenue: number;
  totalPlatformFees: number;
  pendingPayouts: number;
  refundedAmount: number;
}

interface PaymentRecord {
  id: string;
  workId: string;
  userId: string;
  workerId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  platformFee: number;
  workerPayout: number;
  currency: string;
  status: string;
  workCompletedAt?: string;
  payoutScheduledAt?: string;
  payoutCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900">
          <CheckCircle2 className="w-3 h-3" />
          Paid
        </span>
      );
    case "worker_credited":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900">
          <CheckCircle2 className="w-3 h-3" />
          Settled
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900">
          <RefreshCw className="w-3 h-3" />
          Refunded
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
          {status}
        </span>
      );
  }
}

// ── Lifecycle stage pill ──────────────────────────────────────────────────────
function StagePill({ payment }: { payment: PaymentRecord }) {
  if (payment.status === "worker_credited") {
    return (
      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
        ✓ Fully settled
      </span>
    );
  }
  if (payment.status === "paid" && payment.payoutScheduledAt) {
    return (
      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Payout in queue
      </span>
    );
  }
  if (payment.status === "paid") {
    return (
      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
        Work in progress
      </span>
    );
  }
  if (payment.status === "refunded") {
    return <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Refunded</span>;
  }
  return null;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent?: "gray" | "green" | "yellow" | "red";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card
      data-slot="card"
      className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
    >
      <CardHeader>
        <CardDescription>{title}</CardDescription>

        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>

        <CardAction>
          <div className="rounded-md bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </CardAction>
      </CardHeader>

      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground">
          {subtitle}
        </div>
      </CardFooter>
    </Card>
  );
}

// ── Payment lifecycle timeline ───────────────────────────────────────────────
function PaymentTimeline({ payment }: { payment: PaymentRecord }) {
  const steps = [
    {
      label: "Payment initiated",
      time: payment.createdAt,
      done: true,
    },
    {
      label: "Payment confirmed",
      time: payment.status !== "pending" ? payment.updatedAt : undefined,
      done: payment.status !== "pending" && payment.status !== "failed",
    },
    {
      label: "Work completed",
      time: payment.workCompletedAt,
      done: !!payment.workCompletedAt,
    },
    {
      label: "Payout scheduled",
      time: payment.payoutScheduledAt,
      done: !!payment.payoutScheduledAt,
    },
    {
      label: "Worker credited",
      time: payment.payoutCompletedAt,
      done: payment.status === "worker_credited",
    },
  ];

  return (
    <div className="flex items-start gap-0 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {i > 0 && (
              <div className={`flex-1 h-0.5 ${step.done ? "bg-foreground/80" : "bg-muted"}`} />
            )}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
                }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 ${steps[i + 1].done ? "bg-foreground/50" : "bg-muted"}`} />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center leading-tight px-1">
            {step.label}
          </p>
          {step.time && (
            <p className="text-[9px] text-muted-foreground text-center">
              {formatDate(step.time)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Payments() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchSummary = async () => {
    try {
      const res = await PaymentService.getAdminSummary();
      setSummary(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load summary");
    }
  };

  const fetchPayments = useCallback(async (p: number) => {
    try {
      setTableLoading(true);
      const res = await PaymentService.getAdminPaymentsList(p, LIMIT);
      const data = res.data.data;
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setTableLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchPayments(1)]);
    setLoading(false);
  }, [fetchPayments]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchPayments(page);
  }, [page, fetchPayments]);

  // Client-side status filter
  const filtered =
    statusFilter === "all"
      ? payments
      : payments.filter((p) => p.status === statusFilter);

  // Counts for filter pills
  const counts = {
    all: payments.length,
    pending: payments.filter(p => p.status === "pending").length,
    paid: payments.filter(p => p.status === "paid").length,
    worker_credited: payments.filter(p => p.status === "worker_credited").length,
    refunded: payments.filter(p => p.status === "refunded").length,
    failed: payments.filter(p => p.status === "failed").length,
  };

  // Derived stats
  const settledCount = payments.filter(p => p.status === "worker_credited").length;
  const pendingPayoutCount = payments.filter(p => p.status === "paid").length;

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
        <AlertCircle className="w-10 h-10 text-red-400 dark:text-red-500 mx-auto" />
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <Button variant="outline" onClick={fetchAll}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Primary Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross Revenue"
          value={formatAmount(summary?.totalRevenue ?? 0)}
          subtitle="All completed payments"
          icon={TrendingUp}
          accent="gray"
        />

        <StatCard
          title="Platform Earnings"
          value={formatAmount(summary?.totalPlatformFees ?? 0)}
          subtitle="1% fee on each job"
          icon={Banknote}
          accent="green"
        />

        <StatCard
          title="Pending Payouts"
          value={formatAmount(summary?.pendingPayouts ?? 0)}
          subtitle={`${pendingPayoutCount} worker payment${pendingPayoutCount !== 1 ? "s" : ""
            } queued`}
          icon={Clock}
          accent="yellow"
        />

        <StatCard
          title="Total Refunded"
          value={formatAmount(summary?.refundedAmount ?? 0)}
          subtitle="Dispute & cancellation refunds"
          icon={RefreshCw}
          accent="red"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fully Settled</p>
                <p className="text-xl font-bold text-foreground">{settledCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Worker credited & closed</p>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active Jobs</p>
                <p className="text-xl font-bold text-foreground">{pendingPayoutCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Payment made, work ongoing</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Across all statuses</p>
              </div>
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base font-semibold">All Transactions</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total} total · click any row for full timeline
              </p>
            </div>
            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "pending", "paid", "worker_credited", "refunded", "failed"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={statusFilter === s ? "default" : "secondary"}
                  onClick={() => setStatusFilter(s)}
                  className="h-7 rounded-full px-3 text-xs font-medium capitalize"
                >
                  {s === "worker_credited" ? "settled" : s}
                  {counts[s] > 0 && (
                    <span
                      className={
                        statusFilter === s
                          ? "ml-1.5 text-primary-foreground/70"
                          : "ml-1.5 text-muted-foreground"
                      }
                    >
                      {counts[s]}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tableLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No payments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[180px]">Job / Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Fee (1%)</TableHead>
                    <TableHead className="text-right">Worker Gets</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => (
                    <Fragment key={payment.id}>
                      <TableRow
                        className={`cursor-pointer ${expandedRow === payment.id ? "bg-muted/40" : ""}`}
                        onClick={() =>
                          setExpandedRow(expandedRow === payment.id ? null : payment.id)
                        }
                      >
                        <TableCell>
                          <p className="font-medium text-foreground truncate max-w-[160px]">
                            Job #{payment.workId.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                            {payment.id.slice(0, 8)}…
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatAmount(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right text-foreground font-medium">
                          +{formatAmount(payment.platformFee)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatAmount(payment.workerPayout)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                          {formatDate(payment.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StagePill payment={payment} />
                        </TableCell>
                      </TableRow>

                      {/* ── Expanded detail row ── */}
                      {expandedRow === payment.id && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={7} className="px-4 py-5">
                            {/* Timeline */}
                            <PaymentTimeline payment={payment} />

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-5 pt-4 border-t">
                              <div>
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Payment started
                                </p>
                                <p className="text-foreground">{formatDateTime(payment.createdAt)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Work completed
                                </p>
                                <p className="text-foreground">{formatDateTime(payment.workCompletedAt)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Payout queued
                                </p>
                                <p className="text-foreground">{formatDateTime(payment.payoutScheduledAt)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Worker credited
                                </p>
                                <p className="text-foreground">
                                  {payment.payoutCompletedAt
                                    ? formatDateTime(payment.payoutCompletedAt)
                                    : payment.status === "paid"
                                      ? <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3 inline" /> Within 1 hour of completion</span>
                                      : "—"
                                  }
                                </p>
                              </div>

                              {/* IDs */}
                              {payment.razorpayOrderId && (
                                <div className="col-span-2">
                                  <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    Razorpay Order ID
                                  </p>
                                  <p className="text-foreground font-mono text-xs break-all">
                                    {payment.razorpayOrderId}
                                  </p>
                                </div>
                              )}
                              {payment.razorpayPaymentId && (
                                <div className="col-span-2">
                                  <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    Razorpay Payment ID
                                  </p>
                                  <p className="text-foreground font-mono text-xs break-all">
                                    {payment.razorpayPaymentId}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  User ID
                                </p>
                                <p className="text-foreground font-mono truncate">{payment.userId}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Worker ID
                                </p>
                                <p className="text-foreground font-mono truncate">{payment.workerId}</p>
                              </div>

                              {/* Fee breakdown */}
                              <div className="col-span-2 sm:col-span-4">
                                <p className="font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                  Fee Breakdown
                                </p>

                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2">
                                    <span className="text-muted-foreground">Client paid</span>
                                    <span className="font-semibold text-foreground">
                                      {formatAmount(payment.amount)}
                                    </span>
                                  </div>

                                  <span className="text-muted-foreground">→</span>

                                  <div className="flex items-center gap-2 bg-muted border rounded-lg px-3 py-2">
                                    <span className="text-foreground/80">Platform earns</span>
                                    <span className="font-semibold text-foreground">
                                      {formatAmount(payment.platformFee)}
                                    </span>
                                  </div>

                                  <span className="text-muted-foreground">+</span>

                                  <div className="flex items-center gap-2 bg-muted border rounded-lg px-3 py-2">
                                    <span className="text-foreground/80">Worker receives</span>
                                    <span className="font-semibold text-foreground">
                                      {formatAmount(payment.workerPayout)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || tableLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || tableLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border border-dashed bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            How WorkBee payments work
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
              <p>User confirms a job and pays via Razorpay. Work status changes to <strong className="text-foreground">assigned</strong>.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
              <p>Worker completes the job and marks it <strong className="text-foreground">completed</strong> in the live works page.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
              <p>Payout is <strong className="text-foreground">held for 1 hour</strong> for dispute resolution, then auto-released to worker wallet.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
              <p>Worker receives <strong className="text-foreground">99%</strong> of the job value. WorkBee keeps the <strong className="text-foreground">1% platform fee</strong>.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}