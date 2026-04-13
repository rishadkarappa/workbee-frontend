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
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          Credited
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "gray",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent?: "gray" | "green" | "blue" | "yellow" | "red";
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
        <p className={`text-xs mt-1 ${c.sub}`}>{subtitle}</p>
      </CardContent>
    </Card>
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

  const pendingCount = payments.filter((p) => p.status === "paid").length;

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
            Platform revenue and payout oversight
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatAmount(summary?.totalRevenue ?? 0)}
          subtitle="All completed payments"
          icon={TrendingUp}
          accent="gray"
        />
        <StatCard
          title="Platform Earnings"
          value={formatAmount(summary?.totalPlatformFees ?? 0)}
          subtitle="1% fee collected"
          icon={Banknote}
          accent="green"
        />
        <StatCard
          title="Pending Payouts"
          value={formatAmount(summary?.pendingPayouts ?? 0)}
          subtitle={`${pendingCount} worker payment${pendingCount !== 1 ? "s" : ""} pending`}
          icon={Clock}
          accent="yellow"
        />
        <StatCard
          title="Refunded"
          value={formatAmount(summary?.refundedAmount ?? 0)}
          subtitle="Total refunds issued"
          icon={RefreshCw}
          accent="red"
        />
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                All Payments
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total} total payment{total !== 1 ? "s" : ""}
              </p>
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "pending", "paid", "worker_credited", "refunded", "failed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    statusFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "worker_credited" ? "credited" : s}
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Payment
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Platform Fee
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Worker Gets
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Started
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Credited
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((payment) => (
                    <>
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === payment.id ? null : payment.id
                          )
                        }
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[160px]">
                            Work #{payment.workId.slice(-6)}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[160px]">
                            {payment.id.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          {formatAmount(payment.platformFee)}
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
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {payment.payoutCompletedAt
                            ? formatDateTime(payment.payoutCompletedAt)
                            : payment.status === "paid"
                            ? (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <Clock className="w-3 h-3" />
                                Scheduled
                              </span>
                            )
                            : "—"}
                        </td>
                      </tr>

                      {/* Expanded row detail */}
                      {expandedRow === payment.id && (
                        <tr key={`${payment.id}-detail`} className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Payment started
                                </p>
                                <p className="text-gray-800">
                                  {formatDateTime(payment.createdAt)}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Work completed
                                </p>
                                <p className="text-gray-800">
                                  {formatDateTime(payment.workCompletedAt)}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Payout scheduled
                                </p>
                                <p className="text-gray-800">
                                  {formatDateTime(payment.payoutScheduledAt)}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Worker credited
                                </p>
                                <p className="text-gray-800">
                                  {formatDateTime(payment.payoutCompletedAt)}
                                </p>
                              </div>
                              {payment.razorpayOrderId && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Razorpay Order ID
                                  </p>
                                  <p className="text-gray-800 font-mono truncate">
                                    {payment.razorpayOrderId}
                                  </p>
                                </div>
                              )}
                              {payment.razorpayPaymentId && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Razorpay Payment ID
                                  </p>
                                  <p className="text-gray-800 font-mono truncate">
                                    {payment.razorpayPaymentId}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  User ID
                                </p>
                                <p className="text-gray-800 font-mono truncate">
                                  {payment.userId}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Worker ID
                                </p>
                                <p className="text-gray-800 font-mono truncate">
                                  {payment.workerId}
                                </p>
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

      {/* Platform fee info */}
      <Card className="border border-dashed border-gray-200 bg-gray-50/50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <IndianRupee className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
            WorkBee charges a <strong className="text-gray-900">1% platform fee</strong> on every
            completed payment. The remaining <strong className="text-gray-900">99%</strong> is
            credited to the worker's wallet one hour after work is marked complete.
            Click any row to see full timeline details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}