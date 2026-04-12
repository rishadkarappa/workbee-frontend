
// export default function Payments() {
//     return (
//         <div>
//             <h1>Admin Side Payment component</h1>
//             <h2>Total Revenue,
//                 Platform Earnings,
//                 Pending Payouts,
//                 Refunded Amount Details,
//                 Disputed Amount and Details</h2>
//         </div>
//     )
// }


// Admin/component/Payments.tsx

import { useEffect, useState } from "react";
import { IndianRupee, TrendingUp, Clock, RefreshCcw, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentService } from "@/services/payment-service";

interface AdminSummary {
  totalRevenue:      number;
  totalPlatformFees: number;
  pendingPayouts:    number;
  refundedAmount:    number;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "text-gray-900",
}: {
  title:    string;
  value:    string;
  subtitle: string;
  icon:     React.ElementType;
  color?:   string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

export default function Payments() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await PaymentService.getAdminSummary();
      setSummary(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Platform revenue and payout overview</p>
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${summary?.totalRevenue?.toFixed(2) ?? "0.00"}`}
          subtitle="All completed payments"
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="Platform Earnings"
          value={`₹${summary?.totalPlatformFees?.toFixed(2) ?? "0.00"}`}
          subtitle="1% fee on all transactions"
          icon={Percent}
          color="text-blue-600"
        />
        <StatCard
          title="Pending Payouts"
          value={`₹${summary?.pendingPayouts?.toFixed(2) ?? "0.00"}`}
          subtitle="Worker payouts yet to release"
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          title="Refunded Amount"
          value={`₹${summary?.refundedAmount?.toFixed(2) ?? "0.00"}`}
          subtitle="Total refunds issued"
          icon={RefreshCcw}
          color="text-red-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <IndianRupee className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              WorkBee charges a <strong className="text-gray-900">1% platform fee</strong> on every
              completed work payment. The remaining <strong className="text-gray-900">99%</strong> is
              credited to the worker's wallet one hour after the work is marked as completed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}