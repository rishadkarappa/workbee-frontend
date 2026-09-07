import { useEffect, useState, useCallback } from 'react';
import { DisputeService } from '@/services/dispute-service';
import type { DisputeActionType } from '@/services/dispute-service';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquareWarning,
  CalendarDays,
  ShieldCheck,
  User,
  BriefcaseBusiness,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  MailWarning,
  FileWarning,
} from 'lucide-react';

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

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_review: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  dismissed: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  disabled?: boolean;
}

function ActionButton({
  label,
  icon,
  onClick,
  variant = 'outline',
  disabled,
}: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className="justify-start gap-2"
    >
      {icon}
      {label}
    </Button>
  );
}

function DisputeRow({
  dispute,
  onOpen,
}: {
  dispute: Dispute;
  onOpen: (dispute: Dispute) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const complaintLabel =
    COMPLAINT_LABELS[dispute.complaintType] || dispute.complaintType;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">

      {/* Dispute Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <MessageSquareWarning className="h-5 w-5 text-gray-500" />
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-foreground">
                {dispute.workTitle}
              </p>

              <div className="mt-1 flex items-center gap-2">

                <span className="text-xs text-muted-foreground">
                  {complaintLabel}
                </span>

                <span className="text-xs text-muted-foreground">
                  •
                </span>

                <span className="text-xs text-muted-foreground">
                  {new Date(dispute.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>

              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">

            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                STATUS_STYLES[dispute.status]
              }`}
            >
              {dispute.status.replace('_', ' ')}
            </span>

            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}

          </div>

        </div>
      </button>

      {/* Expanded Preview */}
      {expanded && (
        <div className="border-t bg-gray-50/70 px-4 pb-4">

          <div className="grid gap-3 pt-4 sm:grid-cols-3">

            <div className="rounded-lg border bg-white p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BriefcaseBusiness className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Work
                </span>
              </div>

              <p className="mt-1 truncate text-sm font-medium">
                {dispute.workTitle}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Complaint
                </span>
              </div>

              <p className="mt-1 text-sm font-medium">
                {complaintLabel}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Filed
                </span>
              </div>

              <p className="mt-1 text-sm font-medium">
                {new Date(dispute.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>

          </div>

          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => onOpen(dispute)}
          >
            <MessageSquareWarning className="mr-2 h-4 w-4" />
            View Dispute & Take Action
          </Button>

        </div>
      )}
    </div>
  );
}

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [selected, setSelected] = useState<Dispute | null>(null);

  const [actionType, setActionType] =
    useState<DisputeActionType | ''>('');

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDisputes = useCallback(async () => {
    setLoading(true);

    try {
      const res = await DisputeService.getAllDisputes({
        page: 1,
        limit: 50,
        status: statusFilter,
      });

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

  const openDispute = (dispute: Dispute) => {
    setSelected(dispute);
    setActionType('');
    setReason('');
    setError(null);
  };

  const closeDispute = () => {
    if (submitting) return;

    setSelected(null);
    setActionType('');
    setReason('');
    setError(null);
  };

  const selectAction = (action: DisputeActionType) => {
    setActionType(action);
    setError(null);
  };

  const handleApplyAction = async () => {
    if (!selected) return;

    if (!actionType) {
      setError('Please select an action.');
      return;
    }

    if (reason.trim().length < 5) {
      setError('Please provide a reason (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await DisputeService.applyAction(selected.id, {
        actionType,
        reason: reason.trim(),
      });

      setSelected(null);
      setActionType('');
      setReason('');

      await loadDisputes();
    } catch (err) {
      setError(
        getErrorMessage(err) ||
          'Failed to apply action. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* <div>
          <h1 className="text-xl font-semibold">
            Dispute Resolution
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review complaints and take appropriate action.
          </p>
        </div> */}

        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="sm"
            onClick={loadDisputes}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </Button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

        </div>
      </div>

      {/* Disputes */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">

          <MessageSquareWarning className="mx-auto mb-3 h-10 w-10 text-gray-300" />

          <p className="text-sm text-gray-500">
            No disputes found.
          </p>

        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <DisputeRow
              key={dispute.id}
              dispute={dispute}
              onOpen={openDispute}
            />
          ))}
        </div>
      )}

      {/* Dispute Modal */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) closeDispute();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          {selected && (
            <>
              <DialogHeader>

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <MessageSquareWarning className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">

                    <DialogTitle className="truncate">
                      {selected.workTitle}
                    </DialogTitle>

                    <DialogDescription className="mt-1">
                      {COMPLAINT_LABELS[selected.complaintType] ||
                        selected.complaintType}
                    </DialogDescription>

                  </div>

                </div>

              </DialogHeader>

              <div className="space-y-5">

                {/* Status */}
                <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">

                  <span className="text-sm font-medium">
                    Dispute Status
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                      STATUS_STYLES[selected.status]
                    }`}
                  >
                    {selected.status.replace('_', ' ')}
                  </span>

                </div>

                {/* Complaint */}
                <div className="rounded-lg border bg-white p-4">

                  <div className="mb-3 flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-muted-foreground" />

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Complaint Details
                    </p>
                  </div>

                  <p className="text-sm leading-6 text-gray-700">
                    {selected.description}
                  </p>

                </div>

                {/* IDs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BriefcaseBusiness className="h-4 w-4" />
                      <span className="text-xs">
                        Work ID
                      </span>
                    </div>

                    <p className="mt-1 truncate font-mono text-xs">
                      {selected.workId}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-xs">
                        User ID
                      </span>
                    </div>

                    <p className="mt-1 truncate font-mono text-xs">
                      {selected.userId}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-xs">
                        Worker ID
                      </span>
                    </div>

                    <p className="mt-1 truncate font-mono text-xs">
                      {selected.workerId}
                    </p>
                  </div>

                </div>

                {/* Proof */}
                {(selected.proofImages.length > 0 ||
                  selected.proofVideo) && (
                  <div>

                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />

                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Submitted Proof
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 rounded-lg border bg-gray-50 p-4">

                      {selected.proofImages.map((img, index) => (
                        <img
                          key={`${img}-${index}`}
                          src={img}
                          alt={`Proof ${index + 1}`}
                          className="h-24 w-24 rounded-lg border object-cover"
                        />
                      ))}

                      {selected.proofVideo && (
                        <video
                          src={selected.proofVideo}
                          className="h-24 w-40 rounded-lg border object-cover"
                          controls
                        />
                      )}

                    </div>
                  </div>
                )}

                {/* Previous Actions */}
                {selected.actions.length > 0 && (
                  <div>

                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />

                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Previous Actions
                      </p>
                    </div>

                    <div className="space-y-2">

                      {selected.actions.map((action, index) => (
                        <div
                          key={index}
                          className="rounded-lg border bg-gray-50 p-3"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div>
                              <p className="text-sm font-medium capitalize">
                                {action.actionType.replace(/_/g, ' ')}
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {action.reason}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs text-muted-foreground">
                              Admin
                            </span>

                          </div>

                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />

                            {new Date(action.takenAt).toLocaleString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>

                        </div>
                      ))}

                    </div>
                  </div>
                )}

                {/* Take Action */}
                <div className="rounded-xl border bg-gray-50 p-4">

                  <div className="mb-4">

                    <h3 className="text-sm font-semibold">
                      Take Action
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Select an appropriate action for this dispute.
                    </p>

                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                    <ActionButton
                      label="Block Worker"
                      icon={<Ban className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('block_worker')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Unblock Worker"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('unblock_worker')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Block User"
                      icon={<Ban className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('block_user')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Unblock User"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('unblock_user')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Blacklist Worker"
                      icon={<XCircle className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('blacklist_worker')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Unblacklist Worker"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('unblacklist_worker')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Blacklist User"
                      icon={<XCircle className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('blacklist_user')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Unblacklist User"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('unblacklist_user')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Warning Email to Worker"
                      icon={<MailWarning className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('warning_email_worker')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Warning Email to User"
                      icon={<MailWarning className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('warning_email_user')
                      }
                      disabled={submitting}
                    />

                    <ActionButton
                      label="Dismiss — No Action"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() =>
                        selectAction('no_action')
                      }
                      disabled={submitting}
                    />

                  </div>

                  {/* Selected Action */}
                  {actionType && (
                    <div className="mt-4 rounded-lg border bg-white p-4">

                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Selected Action
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize">
                        {actionType.replace(/_/g, ' ')}
                      </p>

                      <div className="mt-4">

                        <Textarea
                          value={reason}
                          onChange={(e) =>
                            setReason(e.target.value)
                          }
                          placeholder="Enter the reason for this action..."
                          rows={3}
                          className="resize-none"
                        />

                      </div>

                      {error && (
                        <p className="mt-2 text-xs text-destructive">
                          {error}
                        </p>
                      )}

                    </div>
                  )}

                  {!actionType && error && (
                    <p className="mt-3 text-xs text-destructive">
                      {error}
                    </p>
                  )}

                </div>

              </div>

              <DialogFooter className="gap-2 pt-2">

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeDispute}
                  disabled={submitting}
                >
                  Close
                </Button>

                <Button
                  className="flex-1"
                  onClick={handleApplyAction}
                  disabled={!actionType || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Confirm Action'
                  )}
                </Button>

              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}

