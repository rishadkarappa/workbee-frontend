import { CheckCircle, XCircle, Clock, Wrench, TrendingUp, Flag, ExternalLink, IndianRupee, TicketPercent, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export type SystemMessagePayload =
  | { type: 'WORK_CONFIRM_REQUEST'; workId: string; workTitle: string; workerName: string }
  | { type: 'WORK_CONFIRM_ACCEPTED'; workId: string; workTitle: string }
  | { type: 'WORK_CONFIRM_REJECTED'; workId: string; workTitle: string }
  | { type: 'WORK_PROGRESS_UPDATE'; workId: string; workTitle: string; progress: string }
  | { type: 'WORK_BID_OFFER' | 'WORK_BID_COUNTER'; bidId: string; workId: string; workTitle: string; userId: string; workerId: string; workerName: string; amount: number; offeredBy: 'user' | 'worker' }
  | { type: 'WORK_BID_ACCEPTED' | 'WORK_BID_REJECTED'; bidId: string; workId: string; workTitle: string; userId: string; workerId: string; workerName: string; amount: number; respondedBy: 'user' | 'worker' }
  | { type: 'WORK_BID_PAID'; bidId: string; workId: string; workTitle: string; userId: string; workerId: string; workerName: string; amount: number };

export type BidMessagePayload =
  | {
    type: "WORK_BID_OFFER" | "WORK_BID_COUNTER";
    bidId: string;
    workId: string;
    workTitle: string;
    userId: string;
    workerId: string;
    workerName: string;
    amount: number;
    offeredBy: "user" | "worker";
  }
  | {
    type: "WORK_BID_ACCEPTED" | "WORK_BID_REJECTED";
    bidId: string;
    workId: string;
    workTitle: string;
    userId: string;
    workerId: string;
    workerName: string;
    amount: number;
    respondedBy: "user" | "worker";
  }
  | {
    type: "WORK_BID_PAID";
    bidId: string;
    workId: string;
    workTitle: string;
    userId: string;
    workerId: string;
    workerName: string;
    amount: number;
  };

interface SystemMessageProps {
  payload: SystemMessagePayload;
  isSender: boolean;
  role: 'user' | 'worker';
  onAccept?: (workId: string) => void;
  onReject?: (workId: string) => void;
  responded?: boolean;

  // Bidding
  onBidAccept?: (payload: BidMessagePayload) => void;
  onBidReject?: (payload: BidMessagePayload) => void;
  onBidCounter?: (payload: BidMessagePayload) => void;
  onBidPay?: (payload: BidMessagePayload) => void;
  isBidActionable?: boolean;
}

const progressConfig: Record<string, { label: string; color: string; Icon: LucideIcon; step: number }> = {
  started: { label: 'Work Started', color: 'text-foreground', Icon: Wrench, step: 1 },
  ongoing: { label: 'Work In Progress', color: 'text-foreground', Icon: TrendingUp, step: 2 },
  completed: { label: 'Work Completed', color: 'text-green-600 dark:text-green-400', Icon: Flag, step: 3 },
};

export function SystemMessage({
  payload, isSender, role, onAccept, onReject, responded,
  onBidAccept, onBidReject, onBidCounter, onBidPay, isBidActionable = true,
}: SystemMessageProps) {
  const navigate = useNavigate();

  // ── Confirmation Request ────────────────────────────────────────────────
  if (payload.type === 'WORK_CONFIRM_REQUEST') {
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-blue-200 dark:border-blue-900 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Deal Request</p>
              <p className="text-sm font-semibold text-foreground">{payload.workerName} wants to confirm</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 mb-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Work</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{payload.workTitle}</p>
          </div>
          {role === 'user' && !isSender ? (
            responded ? (
              <p className="text-xs text-center text-muted-foreground py-1">You have responded to this request</p>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => onAccept?.(payload.workId)}
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs font-semibold rounded-xl"
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </Button>
                <Button
                  onClick={() => onReject?.(payload.workId)}
                  className="flex-1 gap-1.5 text-xs font-semibold rounded-xl"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            )
          ) : (
            <p className="text-xs text-center text-muted-foreground py-1">
              {isSender ? 'Waiting for client response…' : 'Worker sent a confirmation request'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Confirmation Accepted ───────────────────────────────────────────────
  if (payload.type === 'WORK_CONFIRM_ACCEPTED') {
    const navigatePath = role === 'worker' ? '/worker/worker-dashboard/active-works' : '/user-dashboard/active-works';
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-green-200 dark:border-green-900 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Deal Accepted!</p>
              <p className="text-sm font-semibold text-foreground">{payload.workTitle}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">The deal has been confirmed. You can track the work progress from Active Works.</p>
          <Button onClick={() => navigate(navigatePath)} className="w-full gap-1.5 text-sm font-semibold rounded-xl">
            <ExternalLink className="w-3.5 h-3.5" /> Track Work Progress
          </Button>
        </div>
      </div>
    );
  }

  // ── Confirmation Rejected ───────────────────────────────────────────────
  if (payload.type === 'WORK_CONFIRM_REJECTED') {
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-red-200 dark:border-red-900 rounded-2xl shadow-sm p-4 max-w-xs w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-red-500 dark:text-red-400 font-medium uppercase tracking-wide">Deal Rejected</p>
              <p className="text-sm font-semibold text-foreground">{payload.workTitle}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">The client declined this confirmation request.</p>
        </div>
      </div>
    );
  }

  // ── Progress Update ─────────────────────────────────────────────────────
  if (payload.type === 'WORK_PROGRESS_UPDATE') {
    const cfg = progressConfig[payload.progress] || { label: payload.progress, color: 'text-muted-foreground', Icon: Clock, step: 0 };
    const { Icon, color, label, step } = cfg;
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-border rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              payload.progress === 'completed'
                ? 'bg-green-100 dark:bg-green-950/50'
                : payload.progress === 'ongoing'
                ? 'bg-amber-100 dark:bg-amber-950/50'
                : 'bg-blue-100 dark:bg-blue-950/50'
            }`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Progress Update</p>
              <p className={`text-sm font-semibold ${color}`}>{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {['started', 'ongoing', 'completed'].map((s, idx) => {
              const done = step > idx;
              const active = step === idx + 1;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`h-2 flex-1 rounded-full transition-colors ${
                    done || active
                      ? (s === 'completed' ? 'bg-green-500 dark:bg-green-500' : 'bg-foreground')
                      : 'bg-muted'
                  }`} />
                  {idx < 2 && <div className={`w-1 h-1 rounded-full mx-0.5 ${done ? 'bg-muted-foreground' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{payload.workTitle}</p>
        </div>
      </div>
    );
  }

  // ── Bid: Offer / Counter ─────────────────────────────────────────────────
  if (payload.type === 'WORK_BID_OFFER' || payload.type === 'WORK_BID_COUNTER') {
    const isCounter = payload.type === 'WORK_BID_COUNTER';
    const iAmRecipient =
      (payload.offeredBy === 'worker' && role === 'user') ||
      (payload.offeredBy === 'user' && role === 'worker');
    const canCounter = !isCounter && iAmRecipient; // only the very first offer can be countered

    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-border rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
              <TicketPercent className="w-4 h-4 text-background" />
            </div>
            <div>
              <p className="text-xs text-foreground font-medium uppercase tracking-wide">
                {isCounter ? 'Counter Offer' : 'Price Offer'}
              </p>
              <p className="text-sm font-semibold text-foreground">
                From {payload.offeredBy === 'worker' ? payload.workerName : 'Client'}
              </p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 mb-3 flex items-center gap-1">
            <IndianRupee className="w-5 h-5 text-foreground" />
            <span className="text-2xl font-bold text-foreground">{payload.amount}</span>
          </div>
          {iAmRecipient && isBidActionable ? (
            <div className="flex gap-2">
              <Button onClick={() => onBidAccept?.(payload)} variant="outline" className="flex-1 text-xs font-semibold rounded-xl">
                Accept
              </Button>
              <Button onClick={() => onBidReject?.(payload)} variant="outline" className="flex-1 text-xs font-semibold rounded-xl">
                Reject
              </Button>
              {canCounter && (
                <Button onClick={() => onBidCounter?.(payload)} variant="outline" className="flex-1 text-xs font-semibold rounded-xl">
                  Counter
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-1">
              {isBidActionable ? 'Waiting for a response…' : 'This negotiation has moved on'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Bid: Accepted (client pays) ──────────────────────────────────────────
  if (payload.type === 'WORK_BID_ACCEPTED') {
    const iShouldPay = role === 'user'; // client always funds the deal
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-green-200 dark:border-green-900 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Offer Accepted</p>
              <p className="text-sm font-semibold text-foreground">₹{payload.amount} — {payload.workTitle}</p>
            </div>
          </div>
          {iShouldPay && isBidActionable ? (
            <Button onClick={() => onBidPay?.(payload)} className="w-full text-sm font-semibold rounded-xl">
              Pay ₹{payload.amount} now
            </Button>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-1">
              {isBidActionable ? 'Waiting for payment…' : 'Payment completed'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Bid: Rejected ─────────────────────────────────────────────────────────
  if (payload.type === 'WORK_BID_REJECTED') {
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-red-200 dark:border-red-900 rounded-2xl shadow-sm p-4 max-w-xs w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-red-500 dark:text-red-400 font-medium uppercase tracking-wide">Offer Rejected</p>
              <p className="text-sm font-semibold text-foreground">₹{payload.amount}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Bid: Paid ────────────────────────────────────────────────────────────
  if (payload.type === 'WORK_BID_PAID') {
    const navigatePath = role === 'worker' ? '/worker/worker-dashboard/active-works' : '/user-dashboard/active-works';
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-card text-card-foreground border-2 border-green-200 dark:border-green-900 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Payment Completed</p>
              <p className="text-sm font-semibold text-foreground">₹{payload.amount} — {payload.workTitle}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">The deal is confirmed. You can track the work progress from Active Works.</p>
          <Button onClick={() => navigate(navigatePath)} className="w-full gap-1.5 text-sm font-semibold rounded-xl">
            <ExternalLink className="w-3.5 h-3.5" /> Track Work Progress
          </Button>
        </div>
      </div>
    );
  }

  return null;
}