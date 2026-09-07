import { useEffect, useState, useCallback } from 'react';
import { DisputeService } from '@/services/dispute-service';
import type { DisputeActionType } from '@/services/dispute-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/utils/error-helper';

interface DisputeActionItem {
  actionType: string;
  reason: string;
  takenBy: string;
  takenAt: string;
}

interface Dispute {
  id: string;
  workId: string;
  workTitle: string;
  userId: string;
  workerId: string;
  complaintType: string;
  description: string;
  proofImages: string[];
  proofVideo?: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  actions: DisputeActionItem[];
  createdAt: string;
}

const COMPLAINT_LABELS: Record<string, string> = {
  against_worker: 'Against Worker',
  about_work: 'About Work',
  cleanliness: 'Cleanliness',
  behavior: 'Behavior',
  work_not_completed: 'Work Not Completed',
  fraud_suspicion: 'Fraud Suspicion',
  other: 'Other',
};

const ACTION_OPTIONS: { value: DisputeActionType; label: string }[] = [
  { value: 'block_worker', label: 'Block Worker' },
  { value: 'unblock_worker', label: 'Unblock Worker' },
  { value: 'block_user', label: 'Block User/Client' },
  { value: 'unblock_user', label: 'Unblock User/Client' },
  { value: 'blacklist_worker', label: 'Blacklist Worker' },
  { value: 'unblacklist_worker', label: 'Unblacklist Worker' },
  { value: 'blacklist_user', label: 'Blacklist User/Client' },
  { value: 'unblacklist_user', label: 'Unblacklist User/Client' },
  { value: 'warning_email_worker', label: 'Send Warning Email to Worker' },
  { value: 'warning_email_user', label: 'Send Warning Email to User/Client' },
  { value: 'no_action', label: 'Dismiss (No Action)' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [actionType, setActionType] = useState<DisputeActionType | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await DisputeService.getAllDisputes({ page: 1, limit: 50, status: statusFilter });
      setDisputes(res.data.data?.disputes || []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const openDispute = (d: Dispute) => {
    setSelected(d);
    setActionType('');
    setReason('');
    setError(null);
  };

  const handleApplyAction = async () => {
    if (!selected) return;
    if (!actionType) {
      setError('Please select an action.');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Please provide a reason (min 5 characters).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await DisputeService.applyAction(selected.id, { actionType, reason: reason.trim() });
      setSelected(null);
      await loadDisputes();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to apply action. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dispute Resolution</h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : disputes.length === 0 ? (
        <p className="text-gray-500 text-sm">No disputes found.</p>
      ) : (
        <div className="border rounded-lg divide-y bg-white">
          {disputes.map(d => (
            <button
              key={d.id}
              onClick={() => openDispute(d)}
              className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{d.workTitle}</p>
                <p className="text-xs text-gray-500">
                  {COMPLAINT_LABELS[d.complaintType] || d.complaintType} · {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[d.status]}`}>
                {d.status.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.workTitle}</DialogTitle>
                <DialogDescription>{COMPLAINT_LABELS[selected.complaintType] || selected.complaintType}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p className="text-gray-700">{selected.description}</p>

                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Work ID: {selected.workId}</p>
                  <p>User ID: {selected.userId}</p>
                  <p>Worker ID: {selected.workerId}</p>
                </div>

                {(selected.proofImages.length > 0 || selected.proofVideo) && (
                  <div className="flex gap-2 flex-wrap">
                    {selected.proofImages.map(img => (
                      <img key={img} src={img} alt="proof" className="w-20 h-20 rounded object-cover" />
                    ))}
                    {selected.proofVideo && (
                      <video src={selected.proofVideo} className="w-20 h-20 rounded object-cover" controls />
                    )}
                  </div>
                )}

                {selected.actions.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-500">Previous actions</p>
                    {selected.actions.map((a, i) => (
                      <p key={i} className="text-xs text-gray-600">
                        {a.actionType.replace(/_/g, ' ')} — {a.reason} ({new Date(a.takenAt).toLocaleDateString()})
                      </p>
                    ))}
                  </div>
                )}

                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Take action</p>
                  <select
                    value={actionType}
                    onChange={e => setActionType(e.target.value as DisputeActionType)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select an action…</option>
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Reason for this action…"
                    rows={3}
                    className="resize-none"
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
              </div>

              <DialogFooter className="gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
                <Button className="flex-1" onClick={handleApplyAction} disabled={submitting}>
                  {submitting ? 'Applying…' : 'Apply Action'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}