
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
  CalendarDays,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="w-full space-y-6 p-6">

      {/* Main Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

        {/* Total Users */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Users
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                12,450
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>8.2% this month</span>
          </div>
        </div>

        {/* Total Workers */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Workers
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                3,240
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>5.4% this month</span>
          </div>
        </div>

        {/* New Appliers */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                New Appliers
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                86
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Awaiting approval
          </p>
        </div>

        {/* Gross Revenue */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Gross Revenue
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                ₹18.6L
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>14.8% this month</span>
          </div>
        </div>

        {/* Platform Earnings */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Platform Earnings
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                ₹2.8L
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>11.2% this month</span>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Pending Payouts
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                ₹1.24L
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            32 payouts pending
          </p>
        </div>

        {/* Active Jobs */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Active Jobs
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                428
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Currently in progress
          </p>
        </div>

        {/* Completed Transactions */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Completed Transactions
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                9,842
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>9.6% this month</span>
          </div>
        </div>

        {/* Works Completed */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Works Completed 
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                7,628
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            All time completed works
          </p>
        </div>

        {/* New Users */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                New Users
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                342
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Registered this month
          </p>
        </div>
      </div>
      

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Earnings Chart */}
<div className="rounded-xl border bg-card p-6 shadow-sm">
  <div className="mb-6">
    <h2 className="text-lg font-semibold">
      Platform Earnings
    </h2>

    <p className="text-sm text-muted-foreground">
      Platform earnings over the last 6 months
    </p>
  </div>

  {/* Chart Placeholder */}
  <div className="flex h-72 items-end justify-between gap-4 rounded-lg bg-muted/30 px-6 pb-6 pt-8">

    {/* January */}
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div
        className="w-full max-w-10 rounded-t-md bg-primary"
        style={{ height: "35%" }}
      />
      <span className="text-xs text-muted-foreground">
        Mar
      </span>
    </div>

    {/* February */}
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div
        className="w-full max-w-10 rounded-t-md bg-primary"
        style={{ height: "48%" }}
      />
      <span className="text-xs text-muted-foreground">
        Apr
      </span>
    </div>

    {/* March */}
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div
        className="w-full max-w-10 rounded-t-md bg-primary"
        style={{ height: "42%" }}
      />
      <span className="text-xs text-muted-foreground">
        May
      </span>
    </div>

    {/* April */}
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div
        className="w-full max-w-10 rounded-t-md bg-primary"
        style={{ height: "65%" }}
      />
      <span className="text-xs text-muted-foreground">
        Jun
      </span>
    </div>

    {/* May */}
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div
        className="w-full max-w-10 rounded-t-md bg-primary"
        style={{ height: "78%" }}
      />
      <span className="text-xs text-muted-foreground">
        Jul
      </span>
    </div>

    {/* June */}
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div
        className="w-full max-w-10 rounded-t-md bg-primary"
        style={{ height: "92%" }}
      />
      <span className="text-xs text-muted-foreground">
        Aug
      </span>
    </div>

  </div>

  <div className="mt-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">
        Total platform earnings
      </p>

      <p className="text-xl font-bold">
        ₹2.8L
      </p>
    </div>

    <div className="flex items-center gap-1 text-sm text-green-600">
      <TrendingUp className="h-4 w-4" />
      <span>11.2%</span>
    </div>
  </div>
</div>

        {/* Revenue Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Revenue Overview
            </h2>

            <p className="text-sm text-muted-foreground">
              Gross revenue and platform earnings
            </p>
          </div>

          <div className="flex h-72 items-center justify-center rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Revenue Chart
            </p>
          </div>
        </div>

        
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Transactions */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Recent Transactions
            </h2>

            <p className="text-sm text-muted-foreground">
              Latest completed transactions
            </p>
          </div>

          <div className="mt-5 space-y-4">

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">
                  Work Payment
                </p>
                <p className="text-sm text-muted-foreground">
                  Transaction #TXN10245
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹8,500
                </p>
                <p className="text-xs text-green-600">
                  Completed
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">
                  Work Payment
                </p>
                <p className="text-sm text-muted-foreground">
                  Transaction #TXN10244
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹4,200
                </p>
                <p className="text-xs text-green-600">
                  Completed
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Work Payment
                </p>
                <p className="text-sm text-muted-foreground">
                  Transaction #TXN10243
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹6,800
                </p>
                <p className="text-xs text-green-600">
                  Completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Pending Payouts
            </h2>

            <p className="text-sm text-muted-foreground">
              Workers waiting for payout
            </p>
          </div>

          <div className="mt-5 space-y-4">

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">
                  Worker #WK1024
                </p>
                <p className="text-sm text-muted-foreground">
                  Plumbing Work
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹4,500
                </p>
                <p className="text-xs text-yellow-600">
                  Pending
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">
                  Worker #WK1021
                </p>
                <p className="text-sm text-muted-foreground">
                  Electrical Work
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹7,200
                </p>
                <p className="text-xs text-yellow-600">
                  Pending
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Worker #WK1018
                </p>
                <p className="text-sm text-muted-foreground">
                  AC Repair
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹3,800
                </p>
                <p className="text-xs text-yellow-600">
                  Pending
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

