import { useEffect, useState } from "react";
import {
    Users,
    UserCheck,
    UserPlus,
    DollarSign,
    Wallet,
    Clock,
    BriefcaseBusiness,
    CheckCircle,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { AuthService } from "@/services/auth-service";
import { WorkService } from "@/services/work-service";
import { PaymentService } from "@/services/payment-service";

interface UserStats {
    totalUsers: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
}

interface WorkStats {
    totalWorkers: number;
    newWorkersThisMonth: number;
    newWorkersLastMonth: number;
    newAppliersCount: number;
    activeJobsCount: number;
    worksCompletedTotal: number;
}

interface PaymentStats {
    grossRevenue: number;
    platformEarnings: number;
    pendingPayoutsAmount: number;
    pendingPayoutsCount: number;
    completedTransactionsCount: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    platformEarningsThisMonth: number;
    platformEarningsLastMonth: number;
    monthlyPlatformEarnings: { month: string; year: number; amount: number }[];
    monthlyRevenue: { month: string; year: number; amount: number }[];
    recentTransactions: { id: string; workId: string; amount: number; status: string; createdAt: string }[];
    pendingPayouts: { paymentId: string; workerId: string; workId: string; workerPayout: number; workCompletedAt?: string }[];
}

function formatLakh(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString("en-IN")}`;
}

function pctChange(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

const AdminDashboard = () => {
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [userLoading, setUserLoading] = useState(true);

    const [workStats, setWorkStats] = useState<WorkStats | null>(null);
    const [workLoading, setWorkLoading] = useState(true);

    const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
    const [paymentLoading, setPaymentLoading] = useState(true);

    // Auth service call — independent
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setUserLoading(true);
                const res = await AuthService.getAdminUserStats();
                if (!cancelled) setUserStats(res.data.data);
            } finally {
                if (!cancelled) setUserLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Work service call — independent
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setWorkLoading(true);
                const res = await WorkService.getAdminWorkStats();
                if (!cancelled) setWorkStats(res.data.data);
            } finally {
                if (!cancelled) setWorkLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Payment service call — independent
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setPaymentLoading(true);
                const res = await PaymentService.getAdminPaymentStats();
                if (!cancelled) setPaymentStats(res.data.data);
            } finally {
                if (!cancelled) setPaymentLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const userTrend = userStats ? pctChange(userStats.newUsersThisMonth, userStats.newUsersLastMonth) : null;
    const workerTrend = workStats ? pctChange(workStats.newWorkersThisMonth, workStats.newWorkersLastMonth) : null;
    const revenueTrend = paymentStats ? pctChange(paymentStats.revenueThisMonth, paymentStats.revenueLastMonth) : null;
    const platformTrend = paymentStats ? pctChange(paymentStats.platformEarningsThisMonth, paymentStats.platformEarningsLastMonth) : null;

    const TrendBadge = ({ pct }: { pct: number | null }) => {
        if (pct === null) return null;
        return (
            <div className={`mt-4 flex items-center gap-1 text-sm ${pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                {pct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(pct)}% this month</span>
            </div>
        );
    };

    return (
        <div className="w-full space-y-6 p-6">

            {/* Main Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

                {/* Total Users */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {userLoading ? "—" : (userStats?.totalUsers ?? 0).toLocaleString("en-IN")}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <TrendBadge pct={userTrend} />
                </div>

                {/* Total Workers */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Workers</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {workLoading ? "—" : (workStats?.totalWorkers ?? 0).toLocaleString("en-IN")}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <TrendBadge pct={workerTrend} />
                </div>

                {/* New Appliers */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">New Appliers</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {workLoading ? "—" : workStats?.newAppliersCount ?? 0}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Awaiting approval</p>
                </div>

                {/* Gross Revenue */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Gross Revenue</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {paymentLoading ? "—" : formatLakh(paymentStats?.grossRevenue ?? 0)}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <TrendBadge pct={revenueTrend} />
                </div>

                {/* Platform Earnings */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Platform Earnings</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {paymentLoading ? "—" : formatLakh(paymentStats?.platformEarnings ?? 0)}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <TrendBadge pct={platformTrend} />
                </div>

                {/* Pending Payouts */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Payouts</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {paymentLoading ? "—" : formatLakh(paymentStats?.pendingPayoutsAmount ?? 0)}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        {paymentStats?.pendingPayoutsCount ?? 0} payouts pending
                    </p>
                </div>

                {/* Active Jobs */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Jobs</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {workLoading ? "—" : workStats?.activeJobsCount ?? 0}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <BriefcaseBusiness className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Currently in progress</p>
                </div>

                {/* Completed Transactions */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Completed Transactions</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {paymentLoading ? "—" : (paymentStats?.completedTransactionsCount ?? 0).toLocaleString("en-IN")}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Works Completed */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Works Completed</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {workLoading ? "—" : (workStats?.worksCompletedTotal ?? 0).toLocaleString("en-IN")}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <BriefcaseBusiness className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">All time completed works</p>
                </div>

                {/* New Users */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">New Users</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {userLoading ? "—" : userStats?.newUsersThisMonth ?? 0}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Registered this month</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Platform Earnings Chart */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Platform Earnings</h2>
                        <p className="text-sm text-muted-foreground">Platform earnings over the last 6 months</p>
                    </div>

                    {paymentLoading ? (
                        <div className="flex h-72 items-center justify-center rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={288}>
                            <BarChart data={paymentStats?.monthlyPlatformEarnings ?? []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Earnings"]} />
                                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total platform earnings</p>
                            <p className="text-xl font-bold">
                                {paymentLoading ? "—" : formatLakh(paymentStats?.platformEarnings ?? 0)}
                            </p>
                        </div>
                        <TrendBadge pct={platformTrend} />
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Revenue Overview</h2>
                        <p className="text-sm text-muted-foreground">Gross revenue and platform earnings</p>
                    </div>

                    {paymentLoading ? (
                        <div className="flex h-72 items-center justify-center rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={288}>
                            <LineChart data={mergeMonthlySeries(paymentStats?.monthlyRevenue, paymentStats?.monthlyPlatformEarnings)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="platformEarnings" name="Platform Earnings" stroke="#16a34a" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Recent Transactions */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold">Recent Transactions</h2>
                        <p className="text-sm text-muted-foreground">Latest completed transactions</p>
                    </div>

                    <div className="mt-5 space-y-4">
                        {paymentLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : paymentStats?.recentTransactions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No transactions yet.</p>
                        ) : (
                            paymentStats?.recentTransactions.map((tx, i) => (
                                <div
                                    key={tx.id}
                                    className={`flex items-center justify-between ${i !== paymentStats.recentTransactions.length - 1 ? "border-b pb-4" : ""}`}
                                >
                                    <div>
                                        <p className="font-medium">Work Payment</p>
                                        <p className="text-sm text-muted-foreground">
                                            Transaction #{tx.id.slice(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₹{tx.amount.toLocaleString("en-IN")}</p>
                                        <p className={`text-xs capitalize ${tx.status === "worker_credited" || tx.status === "paid" ? "text-green-600" : "text-muted-foreground"}`}>
                                            {tx.status.replace("_", " ")}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending Payouts */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold">Pending Payouts</h2>
                        <p className="text-sm text-muted-foreground">Workers waiting for payout</p>
                    </div>

                    <div className="mt-5 space-y-4">
                        {paymentLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : paymentStats?.pendingPayouts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pending payouts.</p>
                        ) : (
                            paymentStats?.pendingPayouts.map((payout, i) => (
                                <div
                                    key={payout.paymentId}
                                    className={`flex items-center justify-between ${i !== paymentStats.pendingPayouts.length - 1 ? "border-b pb-4" : ""}`}
                                >
                                    <div>
                                        <p className="font-medium">Worker #{payout.workerId.slice(0, 6).toUpperCase()}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Work #{payout.workId.slice(0, 6).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₹{payout.workerPayout.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-yellow-600">Pending</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function mergeMonthlySeries(
    revenue?: { month: string; year: number; amount: number }[],
    platformEarnings?: { month: string; year: number; amount: number }[]
) {
    if (!revenue) return [];
    return revenue.map((r, i) => ({
        month: r.month,
        revenue: r.amount,
        platformEarnings: platformEarnings?.[i]?.amount ?? 0,
    }));
}

export default AdminDashboard;