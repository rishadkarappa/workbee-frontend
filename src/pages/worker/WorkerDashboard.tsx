import { useEffect, useMemo, useState } from "react";
import {
    BriefcaseBusiness,
    Star,
    Clock,
    TrendingUp,
    TrendingDown,
    Wallet,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { WorkService } from "@/services/work-service";
import { PaymentService } from "@/services/payment-service";

interface DashboardStats {
    totalWorksCompleted: number;
    worksCompletedThisMonth: number;
    worksCompletedLastMonth: number;
    activeWorksCount: number;
    worksDueThisWeek: number;
    avgRating: number;
    totalReviews: number;
    monthlyCompletedWorks: { month: string; year: number; count: number }[];
    recentCompletedWorks: { id: string; workTitle: string; budget?: number; status: string; completedAt: string }[];
    recentReviews: { rating: number; testimonial?: string; createdAt: string }[];
}

interface EarningsStats {
    totalEarnings: number;
    withdrawableBalance: number;
    pendingBalance: number;
    earningsThisMonth: number;
    earningsLastMonth: number;
    monthlyEarnings: { month: string; year: number; amount: number }[];
}

function pctChange(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

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

function WorkStatusBadge({ status }: { status: string }) {
    return (
        <Badge variant={status === "completed" ? "default" : "secondary"} className="capitalize">
            {status}
        </Badge>
    );
}

const earningsChartConfig = {
    amount: {
        label: "Earnings",
        color: "var(--foreground)",
    },
} satisfies ChartConfig;

const worksChartConfig = {
    count: {
        label: "Works",
        color: "var(--foreground)",
    },
} satisfies ChartConfig;

export default function WorkerDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [earnings, setEarnings] = useState<EarningsStats | null>(null);
    const [earningsLoading, setEarningsLoading] = useState(true);
    const [earningsError, setEarningsError] = useState<string | null>(null);

    // Work service call — independent of payment service
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setStatsLoading(true);
                const res = await WorkService.getWorkerDashboardStats();
                if (!cancelled) setStats(res.data.data);
            } catch {
                if (!cancelled) setStatsError("Failed to load work stats");
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Payment service call — independent of work service
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setEarningsLoading(true);
                const res = await PaymentService.getWorkerEarningsStats();
                if (!cancelled) setEarnings(res.data.data);
            } catch {
                if (!cancelled) setEarningsError("Failed to load earnings");
            } finally {
                if (!cancelled) setEarningsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const worksTrendPct = stats ? pctChange(stats.worksCompletedThisMonth, stats.worksCompletedLastMonth) : null;
    const earningsTrendPct = earnings ? pctChange(earnings.earningsThisMonth, earnings.earningsLastMonth) : null;

    const monthlyEarningsData = useMemo(() => earnings?.monthlyEarnings ?? [], [earnings]);

    return (
        <div className="w-full space-y-6">

            {/* Primary KPI row — gradient-tinted cards, shadcn dashboard-01 pattern */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Works Completed</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {statsLoading ? "—" : stats?.totalWorksCompleted ?? 0}
                        </CardTitle>
                        <CardAction>
                            <TrendBadge pct={worksTrendPct} />
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">
                            {statsLoading ? "Loading…" : `${stats?.worksCompletedThisMonth ?? 0} completed this month`}
                        </div>
                    </CardFooter>
                </Card>

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Total Earnings</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {earningsLoading ? "—" : `₹${(earnings?.totalEarnings ?? 0).toLocaleString("en-IN")}`}
                        </CardTitle>
                        <CardAction>
                            <TrendBadge pct={earningsTrendPct} />
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">All-time, across all payouts</div>
                    </CardFooter>
                </Card>

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Withdrawable</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {earningsLoading ? "—" : `₹${(earnings?.withdrawableBalance ?? 0).toLocaleString("en-IN")}`}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">Available for withdrawal</div>
                    </CardFooter>
                </Card>

                <Card data-slot="card" className="@container/card">
                    <CardHeader>
                        <CardDescription>Average Rating</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {statsLoading ? "—" : (stats?.avgRating ?? 0).toFixed(1)}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">
                            Based on {stats?.totalReviews ?? 0} reviews
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Secondary KPI row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <Clock className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">Active Works</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {statsLoading ? "—" : stats?.activeWorksCount ?? 0}
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
                            <p className="truncate text-xs text-muted-foreground">Work Due This Week</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {statsLoading ? "—" : stats?.worksDueThisWeek ?? 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="rounded-md bg-muted p-2">
                            <Wallet className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">Pending Balance</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {earningsLoading ? "—" : `₹${(earnings?.pendingBalance ?? 0).toLocaleString("en-IN")}`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-3">

                {/* Earnings Overview — gradient area chart, spans 2 cols */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Earnings Overview</CardTitle>
                        <CardDescription>Your earnings over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {earningsLoading ? (
                            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                                Loading…
                            </div>
                        ) : earningsError ? (
                            <div className="flex h-[280px] items-center justify-center text-sm text-destructive">
                                {earningsError}
                            </div>
                        ) : (
                            <ChartContainer config={earningsChartConfig} className="h-[280px] w-full">
                                <AreaChart data={monthlyEarningsData}>
                                    <defs>
                                        <linearGradient id="fillEarnings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.05} />
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
                                        dataKey="amount"
                                        type="natural"
                                        fill="url(#fillEarnings)"
                                        stroke="var(--color-amount)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Works — bar chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Completed Works</CardTitle>
                        <CardDescription>Last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                                Loading…
                            </div>
                        ) : statsError ? (
                            <div className="flex h-[200px] items-center justify-center text-sm text-destructive">
                                {statsError}
                            </div>
                        ) : (
                            <ChartContainer config={worksChartConfig} className="h-[200px] w-full">
                                <BarChart data={stats?.monthlyCompletedWorks ?? []}>
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
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 border-t text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            {stats?.totalWorksCompleted ?? 0} total completed
                            <TrendBadge pct={worksTrendPct} />
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid gap-4 lg:grid-cols-2">

                {/* Recent Works */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Works</CardTitle>
                        <CardDescription>Your recently completed works</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : stats?.recentCompletedWorks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No completed works yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Work</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats?.recentCompletedWorks.map((work) => (
                                        <TableRow key={work.id}>
                                            <TableCell className="font-medium">{work.workTitle}</TableCell>
                                            <TableCell>
                                                <WorkStatusBadge status={work.status} />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {work.budget ? `₹${work.budget.toLocaleString("en-IN")}` : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Reviews */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Reviews</CardTitle>
                        <CardDescription>What clients are saying about your work</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {statsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : stats?.recentReviews.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No reviews yet.</p>
                        ) : (
                            stats?.recentReviews.map((review, i) => (
                                <div
                                    key={i}
                                    className={i !== stats.recentReviews.length - 1 ? "border-b pb-4" : ""}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Client</span>
                                        <Badge variant="outline" className="gap-1">
                                            <Star className="size-3 fill-current" />
                                            {review.rating.toFixed(1)}
                                        </Badge>
                                    </div>
                                    {review.testimonial && (
                                        <p className="mt-2 text-sm text-muted-foreground">{review.testimonial}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}