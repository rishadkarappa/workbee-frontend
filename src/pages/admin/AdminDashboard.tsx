import { useEffect, useMemo, useState } from "react";
import {
    UserPlus,
    Clock,
    BriefcaseBusiness,
    CheckCircle,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
} from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
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

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "var(--foreground)",
    },
    platformEarnings: {
        label: "Platform Earnings",
        color: "var(--muted-foreground)",
    },
} satisfies ChartConfig;

const earningsChartConfig = {
    amount: {
        label: "Earnings",
        color: "var(--foreground)",
    },
} satisfies ChartConfig;

function TrendBadge({ pct }: { pct: number | null }) {
    if (pct === null) return null;
    const isUp = pct >= 0;
    return (
        <Badge variant="outline" className="text-xs">
            {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {isUp ? "+" : ""}{pct}%
        </Badge>
    );
}

function StatusBadge({ status }: { status: string }) {
    const label = status.replace("_", " ");
    const isSettled = status === "worker_credited" || status === "paid";
    return (
        <Badge variant={isSettled ? "default" : "secondary"} className="capitalize">
            {label}
        </Badge>
    );
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

    const revenueOverviewData = useMemo(() => {
        if (!paymentStats) return [];
        return paymentStats.monthlyRevenue.map((r, i) => ({
            month: r.month,
            revenue: r.amount,
            platformEarnings: paymentStats.monthlyPlatformEarnings[i]?.amount ?? 0,
        }));
    }, [paymentStats]);

    return (
        <div className="w-full space-y-6 p-6">

            {/* Primary KPI row — gradient-tinted cards, shadcn dashboard-01 pattern */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Total Users</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {userLoading ? "—" : (userStats?.totalUsers ?? 0).toLocaleString("en-IN")}
                        </CardTitle>
                        <CardAction>
                            <TrendBadge pct={userTrend} />
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">
                            {userLoading ? "Loading…" : `${userStats?.newUsersThisMonth ?? 0} registered this month`}
                        </div>
                    </CardFooter>
                </Card>

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Total Workers</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {workLoading ? "—" : (workStats?.totalWorkers ?? 0).toLocaleString("en-IN")}
                        </CardTitle>
                        <CardAction>
                            <TrendBadge pct={workerTrend} />
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">
                            {workLoading ? "Loading…" : `${workStats?.newAppliersCount ?? 0} awaiting approval`}
                        </div>
                    </CardFooter>
                </Card>

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Gross Revenue</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {paymentLoading ? "—" : formatLakh(paymentStats?.grossRevenue ?? 0)}
                        </CardTitle>
                        <CardAction>
                            <TrendBadge pct={revenueTrend} />
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">Across all completed payments</div>
                    </CardFooter>
                </Card>

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Platform Earnings</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {paymentLoading ? "—" : formatLakh(paymentStats?.platformEarnings ?? 0)}
                        </CardTitle>
                        <CardAction>
                            <TrendBadge pct={platformTrend} />
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">Platform fee collected</div>
                    </CardFooter>
                </Card>
            </div>

            {/* Secondary KPI row — compact stat cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <Clock className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">Pending Payouts</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {paymentLoading ? "—" : formatLakh(paymentStats?.pendingPayoutsAmount ?? 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <BriefcaseBusiness className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">Active Jobs</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {workLoading ? "—" : workStats?.activeJobsCount ?? 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <CheckCircle className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">Transactions</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {paymentLoading ? "—" : (paymentStats?.completedTransactionsCount ?? 0).toLocaleString("en-IN")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <BriefcaseBusiness className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">Works Completed</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {workLoading ? "—" : (workStats?.worksCompletedTotal ?? 0).toLocaleString("en-IN")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <UserPlus className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">New Appliers</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {workLoading ? "—" : workStats?.newAppliersCount ?? 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-3">

                {/* blaa */}

                {/* Revenue Overview — area chart, spans 2 cols */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Gross revenue vs. platform earnings — last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentLoading ? (
                            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                                Loading…
                            </div>
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[280px] w-full">
                                <AreaChart data={revenueOverviewData}>
                                    <defs>
                                        <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="fillPlatformEarnings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-platformEarnings)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--color-platformEarnings)" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        fontSize={12}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Area
                                        dataKey="platformEarnings"
                                        type="natural"
                                        fill="url(#fillPlatformEarnings)"
                                        stroke="var(--color-platformEarnings)"
                                        stackId="a"
                                    />
                                    <Area
                                        dataKey="revenue"
                                        type="natural"
                                        fill="url(#fillRevenue)"
                                        stroke="var(--color-revenue)"
                                        stackId="b"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Platform Earnings — bar chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Earnings</CardTitle>
                        <CardDescription>Last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentLoading ? (
                            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                                Loading…
                            </div>
                        ) : (
                            <ChartContainer config={earningsChartConfig} className="h-[200px] w-full">
                                <BarChart data={paymentStats?.monthlyPlatformEarnings ?? []}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        fontSize={12}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 border-t text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            Total earnings {formatLakh(paymentStats?.platformEarnings ?? 0)}
                            <TrendBadge pct={platformTrend} />
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 lg:grid-cols-2">

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest completed payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : paymentStats?.recentTransactions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No transactions yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentStats?.recentTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="font-medium">Work Payment</div>
                                                <div className="text-xs text-muted-foreground">
                                                    #{tx.id.slice(0, 8).toUpperCase()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={tx.status} />
                                            </TableCell>
                                            <TableCell className="text-right font-medium tabular-nums">
                                                ₹{tx.amount.toLocaleString("en-IN")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Payouts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Payouts</CardTitle>
                        <CardDescription>Workers waiting for payout</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : paymentStats?.pendingPayouts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pending payouts.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Work</TableHead>
                                        <TableHead className="text-right">Payout</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentStats?.pendingPayouts.map((payout) => (
                                        <TableRow key={payout.paymentId}>
                                            <TableCell className="font-medium">
                                                #{payout.workerId.slice(0, 6).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                #{payout.workId.slice(0, 6).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-medium tabular-nums">
                                                    ₹{payout.workerPayout.toLocaleString("en-IN")}
                                                </div>
                                                <Badge variant="secondary" className="mt-1">Pending</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;