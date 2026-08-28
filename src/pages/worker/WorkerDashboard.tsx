import {
  BriefcaseBusiness,
  DollarSign,
  Star,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";

export default function WorkerDashboard() {
  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}


      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Completed Works */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Works Completed
              </p>
              <h2 className="mt-2 text-3xl font-bold">128</h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>12% this month</span>
          </div>
        </div>

        {/* Earnings */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Earnings
              </p>
              <h2 className="mt-2 text-3xl font-bold">₹84,500</h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>8.5% this month</span>
          </div>
        </div>

        {/* Withdrawable Amount */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Withdrawable Amount
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                ₹32,500
              </h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Available for withdrawal
          </p>
        </div>

        {/* Rating */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Average Rating
              </p>
              <h2 className="mt-2 text-3xl font-bold">4.8</h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Star className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Based on 64 reviews
          </p>
        </div>

        {/* Active Works */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Active Works
              </p>
              <h2 className="mt-2 text-3xl font-bold">6</h2>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            2 due this week
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Earnings Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Earnings Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Your earnings over the last 6 months
            </p>
          </div>

          {/* Chart goes here */}
          <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
            Earnings Chart
          </div>
        </div>

        {/* Works Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Completed Works
            </h2>
            <p className="text-sm text-muted-foreground">
              Works completed over the last 6 months
            </p>
          </div>

          {/* Chart goes here */}
          <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
            Works Chart
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Works */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Works</h2>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">House Painting</p>
                <p className="text-sm text-muted-foreground">
                  Completed
                </p>
              </div>

              <span className="font-semibold">₹8,500</span>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">AC Repair</p>
                <p className="text-sm text-muted-foreground">
                  Completed
                </p>
              </div>

              <span className="font-semibold">₹2,500</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Plumbing Work</p>
                <p className="text-sm text-muted-foreground">
                  Completed
                </p>
              </div>

              <span className="font-semibold">₹4,200</span>
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Reviews</h2>

          <div className="mt-4 space-y-4">
            <div className="border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Rahul</span>
                <span className="text-sm">⭐ 5.0</span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Excellent work and very professional.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Shameer</span>
                <span className="text-sm">⭐ 4.8</span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Completed the work on time. Very good service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}