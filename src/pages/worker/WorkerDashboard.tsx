import { useEffect, useState } from "react";
import {
    BriefcaseBusiness,
    DollarSign,
    Star,
    Clock,
    TrendingUp,
    TrendingDown,
    Wallet,
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
    ResponsiveContainer,
} from "recharts";
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

    const worksTrendPct = stats && stats.worksCompletedLastMonth > 0
        ? Math.round(((stats.worksCompletedThisMonth - stats.worksCompletedLastMonth) / stats.worksCompletedLastMonth) * 100)
        : null;

    const earningsTrendPct = earnings && earnings.earningsLastMonth > 0
        ? Math.round(((earnings.earningsThisMonth - earnings.earningsLastMonth) / earnings.earningsLastMonth) * 100)
        : null;

    return (
        <div className="w-full space-y-6 p-6">

            {/* Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

                {/* Completed Works */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Works Completed</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {statsLoading ? "—" : stats?.totalWorksCompleted ?? 0}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <BriefcaseBusiness className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    {worksTrendPct !== null && (
                        <div className={`mt-4 flex items-center gap-1 text-sm ${worksTrendPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {worksTrendPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span>{Math.abs(worksTrendPct)}% this month</span>
                        </div>
                    )}
                </div>

                {/* Total Earnings */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Earnings</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {earningsLoading ? "—" : `₹${(earnings?.totalEarnings ?? 0).toLocaleString("en-IN")}`}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    {earningsTrendPct !== null && (
                        <div className={`mt-4 flex items-center gap-1 text-sm ${earningsTrendPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {earningsTrendPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span>{Math.abs(earningsTrendPct)}% this month</span>
                        </div>
                    )}
                </div>

                {/* Withdrawable Amount */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Withdrawable</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {earningsLoading ? "—" : `₹${(earnings?.withdrawableBalance ?? 0).toLocaleString("en-IN")}`}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Available for withdrawal</p>
                </div>

                {/* Average Rating */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Average Rating</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {statsLoading ? "—" : (stats?.avgRating ?? 0).toFixed(1)}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Star className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Based on {stats?.totalReviews ?? 0} reviews
                    </p>
                </div>

                {/* Active Works */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Works</p>
                            <h2 className="mt-2 text-3xl font-bold">
                                {statsLoading ? "—" : stats?.activeWorksCount ?? 0}
                            </h2>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        {stats?.worksDueThisWeek ?? 0} due this week
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Earnings Chart */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Earnings Overview</h2>
                        <p className="text-sm text-muted-foreground">Your earnings over the last 6 months</p>
                    </div>

                    {earningsLoading ? (
                        <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        </div>
                    ) : earningsError ? (
                        <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                            <p className="text-sm text-destructive">{earningsError}</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={256}>
                            <LineChart data={earnings?.monthlyEarnings ?? []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Earnings"]} />
                                <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Completed Works Chart */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Completed Works</h2>
                        <p className="text-sm text-muted-foreground">Works completed over the last 6 months</p>
                    </div>

                    {statsLoading ? (
                        <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        </div>
                    ) : statsError ? (
                        <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                            <p className="text-sm text-destructive">{statsError}</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={256}>
                            <BarChart data={stats?.monthlyCompletedWorks ?? []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} allowDecimals={false} />
                                <Tooltip formatter={(v: number) => [v, "Works"]} />
                                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Recent Works */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Recent Works</h2>
                            <p className="text-sm text-muted-foreground">Your recently completed works</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {statsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : stats?.recentCompletedWorks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No completed works yet.</p>
                        ) : (
                            stats?.recentCompletedWorks.map((work, i) => (
                                <div
                                    key={work.id}
                                    className={`flex items-center justify-between ${i !== stats.recentCompletedWorks.length - 1 ? "border-b pb-4" : ""}`}
                                >
                                    <div>
                                        <p className="font-medium">{work.workTitle}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{work.status}</p>
                                    </div>
                                    <span className="font-semibold">
                                        {work.budget ? `₹${work.budget.toLocaleString("en-IN")}` : "—"}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold">Recent Reviews</h2>
                        <p className="text-sm text-muted-foreground">What clients are saying about your work</p>
                    </div>

                    <div className="mt-5 space-y-5">
                        {statsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : stats?.recentReviews.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No reviews yet.</p>
                        ) : (
                            stats?.recentReviews.map((review, i) => (
                                <div key={i} className={i !== stats.recentReviews.length - 1 ? "border-b pb-4" : ""}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Client</span>
                                        <span className="text-sm">⭐ {review.rating.toFixed(1)}</span>
                                    </div>
                                    {review.testimonial && (
                                        <p className="mt-2 text-sm text-muted-foreground">{review.testimonial}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}