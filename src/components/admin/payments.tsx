import { useEffect, useState, useCallback } from "react";
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
  ArrowUpRight,
  Wallet,
  BarChart3,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentService } from "@/services/payment-service";

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3" />
          Paid
        </span>
      );
    case "worker_credited":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          Settled
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <RefreshCw className="w-3 h-3" />
          Refunded
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          {status}
        </span>
      );
  }
}

// ── Lifecycle stage pill ──────────────────────────────────────────────────────
function StagePill({ payment }: { payment: PaymentRecord }) {
  if (payment.status === "worker_credited") {
    return (
      <span className="text-xs text-green-600 font-medium">
        ✓ Fully settled
      </span>
    );
  }
  if (payment.status === "paid" && payment.payoutScheduledAt) {
    return (
      <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Payout in queue
      </span>
    );
  }
  if (payment.status === "paid") {
    return (
      <span className="text-xs text-blue-600 font-medium">
        Work in progress
      </span>
    );
  }
  if (payment.status === "refunded") {
    return <span className="text-xs text-purple-600 font-medium">Refunded</span>;
  }
  return null;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "gray",
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent?: "gray" | "green" | "blue" | "yellow" | "red";
  trend?: string;
}) {
  const accentMap = {
    gray:   { bg: "bg-gray-900",   text: "text-white",       sub: "text-gray-400",  iconBg: "bg-gray-800"   },
    green:  { bg: "bg-green-600",  text: "text-white",       sub: "text-green-200", iconBg: "bg-green-700"  },
    blue:   { bg: "bg-blue-600",   text: "text-white",       sub: "text-blue-200",  iconBg: "bg-blue-700"   },
    yellow: { bg: "bg-amber-500",  text: "text-white",       sub: "text-amber-100", iconBg: "bg-amber-600"  },
    red:    { bg: "bg-red-600",    text: "text-white",       sub: "text-red-200",   iconBg: "bg-red-700"    },
  };
  const c = accentMap[accent];

  return (
    <Card className={`border-0 shadow-sm ${c.bg}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className={`text-xs font-medium uppercase tracking-wide ${c.sub}`}>{title}</p>
          <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        <div className="flex items-center justify-between mt-1">
          <p className={`text-xs ${c.sub}`}>{subtitle}</p>
          {trend && (
            <span className={`text-xs flex items-center gap-0.5 ${c.sub}`}>
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
      </CardContent>
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
              <div className={`flex-1 h-0.5 ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 ${steps[i + 1].done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-1 text-center leading-tight px-1">
            {step.label}
          </p>
          {step.time && (
            <p className="text-[9px] text-gray-400 text-center">
              {formatDate(step.time)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Payments() {
  const [summary, setSummary]           = useState<AdminSummary | null>(null);
  const [payments, setPayments]         = useState<PaymentRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow]   = useState<string | null>(null);
  const LIMIT = 15;

  const fetchSummary = async () => {
    try {
      const res = await PaymentService.getAdminSummary();
      setSummary(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load summary");
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
    } catch (err: any) {
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
  const conversionRate = total > 0
    ? Math.round((payments.filter(p => p.status !== "pending" && p.status !== "failed").length / payments.length) * 100)
    : 0;

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
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={fetchAll}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform revenue, payouts, and transaction oversight
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          subtitle={`${pendingPayoutCount} worker payment${pendingPayoutCount !== 1 ? "s" : ""} queued`}
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
                <p className="text-xl font-bold text-green-600">{settledCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Worker credited & closed</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active Jobs</p>
                <p className="text-xl font-bold text-blue-600">{pendingPayoutCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Payment made, work ongoing</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Transactions</p>
                <p className="text-xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Across all statuses</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm">
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
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "worker_credited" ? "settled" : s}
                  {counts[s] > 0 && (
                    <span className={`ml-1.5 ${statusFilter === s ? "text-gray-300" : "text-gray-400"}`}>
                      {counts[s]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tableLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No payments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-[180px]">
                      Job / Payment
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Fee (1%)
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Worker Gets
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Stage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((payment) => (
                    <>
                      <tr
                        key={payment.id}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          expandedRow === payment.id ? "bg-gray-50" : ""
                        }`}
                        onClick={() =>
                          setExpandedRow(expandedRow === payment.id ? null : payment.id)
                        }
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[160px]">
                            Job #{payment.workId.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[160px]">
                            {payment.id.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          +{formatAmount(payment.platformFee)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatAmount(payment.workerPayout)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <StagePill payment={payment} />
                        </td>
                      </tr>

                      {/* ── Expanded detail row ── */}
                      {expandedRow === payment.id && (
                        <tr key={`${payment.id}-detail`} className="bg-gray-50/80">
                          <td colSpan={7} className="px-4 py-5">
                            {/* Timeline */}
                            <PaymentTimeline payment={payment} />

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-5 pt-4 border-t border-gray-200">
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Payment started
                                </p>
                                <p className="text-gray-800">{formatDateTime(payment.createdAt)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Work completed
                                </p>
                                <p className="text-gray-800">{formatDateTime(payment.workCompletedAt)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Payout queued
                                </p>
                                <p className="text-gray-800">{formatDateTime(payment.payoutScheduledAt)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Worker credited
                                </p>
                                <p className="text-gray-800">
                                  {payment.payoutCompletedAt
                                    ? formatDateTime(payment.payoutCompletedAt)
                                    : payment.status === "paid"
                                    ? <span className="text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3 inline" /> Within 1 hour of completion</span>
                                    : "—"
                                  }
                                </p>
                              </div>

                              {/* IDs */}
                              {payment.razorpayOrderId && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Razorpay Order ID
                                  </p>
                                  <p className="text-gray-800 font-mono text-xs break-all">
                                    {payment.razorpayOrderId}
                                  </p>
                                </div>
                              )}
                              {payment.razorpayPaymentId && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Razorpay Payment ID
                                  </p>
                                  <p className="text-gray-800 font-mono text-xs break-all">
                                    {payment.razorpayPaymentId}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  User ID
                                </p>
                                <p className="text-gray-800 font-mono truncate">{payment.userId}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Worker ID
                                </p>
                                <p className="text-gray-800 font-mono truncate">{payment.workerId}</p>
                              </div>

                              {/* Fee breakdown */}
                              <div className="col-span-2 sm:col-span-4">
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Fee Breakdown
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                                    <span className="text-gray-500">Client paid</span>
                                    <span className="font-semibold text-gray-900">{formatAmount(payment.amount)}</span>
                                  </div>
                                  <span className="text-gray-400">→</span>
                                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    <span className="text-green-700">Platform earns</span>
                                    <span className="font-semibold text-green-700">{formatAmount(payment.platformFee)}</span>
                                  </div>
                                  <span className="text-gray-400">+</span>
                                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <span className="text-blue-700">Worker receives</span>
                                    <span className="font-semibold text-blue-700">{formatAmount(payment.workerPayout)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-gray-500">
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
      <Card className="border border-dashed border-gray-200 bg-gray-50/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            How WorkBee payments work
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
              <p>User confirms a job and pays via Razorpay. Work status changes to <strong>assigned</strong>.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
              <p>Worker completes the job and marks it <strong>completed</strong> in the live works page.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
              <p>Payout is <strong>held for 1 hour</strong> for dispute resolution, then auto-released to worker wallet.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
              <p>Worker receives <strong>99%</strong> of the job value. WorkBee keeps the <strong>1% platform fee</strong>.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}