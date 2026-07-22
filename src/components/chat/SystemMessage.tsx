import { CheckCircle, XCircle, Clock, Wrench, TrendingUp, Flag, ExternalLink, IndianRupee, TicketPercent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type SystemMessagePayload =
  | { type: 'WORK_CONFIRM_REQUEST'; workId: string; workTitle: string; workerName: string }
  | { type: 'WORK_CONFIRM_ACCEPTED'; workId: string; workTitle: string }
  | { type: 'WORK_CONFIRM_REJECTED'; workId: string; workTitle: string }
  | { type: 'WORK_PROGRESS_UPDATE'; workId: string; workTitle: string; progress: string }
  | { type: 'WORK_BID_OFFER' | 'WORK_BID_COUNTER'; bidId: string; workId: string; workTitle: string; userId: string; workerId: string; workerName: string; amount: number; offeredBy: 'user' | 'worker' }
  | { type: 'WORK_BID_ACCEPTED' | 'WORK_BID_REJECTED'; bidId: string; workId: string; workTitle: string; userId: string; workerId: string; workerName: string; amount: number; respondedBy: 'user' | 'worker' }
  | { type: 'WORK_BID_PAID'; bidId: string; workId: string; workTitle: string; userId: string; workerId: string; workerName: string; amount: number };

interface SystemMessageProps {
  payload: SystemMessagePayload;
  isSender: boolean;
  role: 'user' | 'worker';
  onAccept?: (workId: string) => void;
  onReject?: (workId: string) => void;
  responded?: boolean;

  // Bidding
  onBidAccept?: (payload: any) => void;
  onBidReject?: (payload: any) => void;
  onBidCounter?: (payload: any) => void;
  onBidPay?: (payload: any) => void;
  /** false = this offer/counter/accept card is stale (a newer event exists for this workId) */
  isBidActionable?: boolean;
}

const progressConfig: Record<string, { label: string; color: string; Icon: any; step: number }> = {
  started: { label: 'Work Started', color: 'text-blue-600', Icon: Wrench, step: 1 },
  ongoing: { label: 'Work In Progress', color: 'text-amber-600', Icon: TrendingUp, step: 2 },
  completed: { label: 'Work Completed', color: 'text-green-600', Icon: Flag, step: 3 },
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
        <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Deal Request</p>
              <p className="text-sm font-semibold text-gray-900">{payload.workerName} wants to confirm</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 mb-3">
            <p className="text-xs text-blue-600 font-medium">Work</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{payload.workTitle}</p>
          </div>
          {role === 'user' && !isSender ? (
            responded ? (
              <p className="text-xs text-center text-gray-400 py-1">You have responded to this request</p>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => onAccept?.(payload.workId)} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
                <button onClick={() => onReject?.(payload.workId)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-center text-gray-400 py-1">
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
        <div className="bg-white border-2 border-green-200 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Deal Accepted!</p>
              <p className="text-sm font-semibold text-gray-900">{payload.workTitle}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">The deal has been confirmed. You can track the work progress from Active Works.</p>
          <button onClick={() => navigate(navigatePath)} className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Track Work Progress
          </button>
        </div>
      </div>
    );
  }

  // ── Confirmation Rejected ───────────────────────────────────────────────
  if (payload.type === 'WORK_CONFIRM_REJECTED') {
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-white border-2 border-red-200 rounded-2xl shadow-sm p-4 max-w-xs w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Deal Rejected</p>
              <p className="text-sm font-semibold text-gray-900">{payload.workTitle}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">The client declined this confirmation request.</p>
        </div>
      </div>
    );
  }

  // ── Progress Update ─────────────────────────────────────────────────────
  if (payload.type === 'WORK_PROGRESS_UPDATE') {
    const cfg = progressConfig[payload.progress] || { label: payload.progress, color: 'text-gray-600', Icon: Clock, step: 0 };
    const { Icon, color, label, step } = cfg;
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payload.progress === 'completed' ? 'bg-green-100' : payload.progress === 'ongoing' ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Progress Update</p>
              <p className={`text-sm font-semibold ${color}`}>{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {['started', 'ongoing', 'completed'].map((s, idx) => {
              const done = step > idx;
              const active = step === idx + 1;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`h-2 flex-1 rounded-full transition-colors ${done || active ? (s === 'completed' ? 'bg-green-500' : s === 'ongoing' ? 'bg-amber-500' : 'bg-blue-500') : 'bg-gray-200'}`} />
                  {idx < 2 && <div className={`w-1 h-1 rounded-full mx-0.5 ${done ? 'bg-gray-400' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">{payload.workTitle}</p>
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
    const canCounter = !isCounter && iAmRecipient; //only the very first offer can be countered

    return (
      <div className="my-2 flex justify-center">
        
        <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
              <TicketPercent className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-900 font-medium uppercase tracking-wide">
                {isCounter ? 'Counter Offer' : 'Price Offer'}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                From {payload.offeredBy === 'worker' ? payload.workerName : 'Client'}
              </p>
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl p-3 mb-3 flex items-center gap-1">
            <IndianRupee className="w-5 h-5 text-gray-900" />
            <span className="text-2xl font-bold text-gray-900">{payload.amount}</span>
          </div>
          {iAmRecipient && isBidActionable ? (
            <div className="flex gap-2">
              <button onClick={() => onBidAccept?.(payload)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
                Accept
              </button>
              <button onClick={() => onBidReject?.(payload)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
                Reject
              </button>
              {canCounter && (
                <button onClick={() => onBidCounter?.(payload)} className="flex-1 border border-gray-900 text-gray-900 text-xs font-semibold py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  Counter
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-center text-gray-500 py-1">
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
        <div className="bg-white border-2 border-green-200 rounded-2xl shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Offer Accepted</p>
              <p className="text-sm font-semibold text-gray-900">₹{payload.amount} — {payload.workTitle}</p>
            </div>
          </div>
          {iShouldPay && isBidActionable ? (
            <button onClick={() => onBidPay?.(payload)} className="w-full bg-black hover:bg-gray-800 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
              Pay ₹{payload.amount} now
            </button>
          ) : (
            <p className="text-xs text-center text-gray-400 py-1">
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
        <div className="bg-white border-2 border-red-200 rounded-2xl shadow-sm p-4 max-w-xs w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Offer Rejected</p>
              <p className="text-sm font-semibold text-gray-900">₹{payload.amount}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Bid: Paid ────────────────────────────────────────────────────────────
  if (payload.type === 'WORK_BID_PAID') {
    return (
      <div className="my-2 flex justify-center">
        <div className="bg-white border-2 border-green-200 rounded-2xl shadow-sm p-4 max-w-xs w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Payment Completed</p>
              <p className="text-sm font-semibold text-gray-900">₹{payload.amount}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Parse helper (now accepts bid types too) ───────────────────────
export function parseSystemMessage(content: string): SystemMessagePayload | null {
  try {
    const parsed = JSON.parse(content);
    const validTypes = [
      'WORK_CONFIRM_REQUEST', 'WORK_CONFIRM_ACCEPTED', 'WORK_CONFIRM_REJECTED', 'WORK_PROGRESS_UPDATE',
      'WORK_BID_OFFER', 'WORK_BID_COUNTER', 'WORK_BID_ACCEPTED', 'WORK_BID_REJECTED', 'WORK_BID_PAID',
    ];
    if (validTypes.includes(parsed?.type)) return parsed as SystemMessagePayload;
    return null;
  } catch {
    return null;
  }
}

// ── Staleness helper: is this bid-related card still the "live" one for its workId? ──
export function isBidCardActionable(messages: { id: string; content: string; type: string }[], targetId: string): boolean {
  const targetIndex = messages.findIndex(m => m.id === targetId);
  if (targetIndex === -1) return true;
  const targetPayload = parseSystemMessage(messages[targetIndex].content);
  if (!targetPayload || !('workId' in targetPayload)) return true;
  const workId = (targetPayload as any).workId;

  for (let i = targetIndex + 1; i < messages.length; i++) {
    const p = parseSystemMessage(messages[i].content);
    if (p && 'workId' in p && (p as any).workId === workId) {
      if (['WORK_BID_OFFER', 'WORK_BID_COUNTER', 'WORK_BID_ACCEPTED', 'WORK_BID_REJECTED', 'WORK_BID_PAID'].includes(p.type)) {
        return false; // a newer bid event exists — this card is resolved/stale
      }
    }
  }
  return true;
}