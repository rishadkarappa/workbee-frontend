import { useEffect, useState, useCallback } from 'react';

import { DisputeService } from '@/services/dispute-service';
import type {
  DisputeActionType,
  WorkerSummary,
  UserSummary,
} from '@/services/dispute-service';

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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  RefreshCw,
  Ban,
  ShieldOff,
  MailWarning,
  UserRound,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  Image as ImageIcon,
  Video,
  Gavel,
} from 'lucide-react';

import { getErrorMessage } from '@/utils/error-helper';

interface DisputeActionItem {
  actionType: string;
  reason: string;
  takenBy: string;
  takenAt: string;
}

interface DisputeListItem {
  id: string;
  workTitle: string;
  complaintType: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface DisputeDetail extends DisputeListItem {
  description: string;
  proofImages: string[];
  proofVideo?: string;
  actions: DisputeActionItem[];
  worker: WorkerSummary;
  user: UserSummary;
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

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400',
    icon: Clock3,
  },

  in_review: {
    label: 'In Review',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400',
    icon: Gavel,
  },

  resolved: {
    label: 'Resolved',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
    icon: CheckCircle2,
  },

  dismissed: {
    label: 'Dismissed',
    className:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
    icon: XCircle,
  },
};

type ActionTargetFilter = 'all' | 'worker' | 'user';

const ITEMS_PER_PAGE = 10;

function StatusBadge({
  status,
}: {
  status: DisputeDetail['status'];
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function EntityStatus({
  isBlocked,
  isBlacklisted,
}: {
  isBlocked: boolean;
  isBlacklisted: boolean;
}) {
  if (isBlacklisted) {
    return (
      <Badge
        variant="outline"
        className="border-slate-800 bg-slate-900 text-white dark:border-slate-300 dark:bg-slate-200 dark:text-slate-900"
      >
        Blacklisted
      </Badge>
    );
  }

  if (isBlocked) {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
      >
        Blocked
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
    >
      Active
    </Badge>
  );
}

function EntityCard({
  icon,
  roleLabel,
  name,
  email,
  image,
  isBlocked,
  isBlacklisted,
  stats,
}: {
  icon: React.ReactNode;
  roleLabel: string;
  name: string;
  email: string;
  image?: string;
  isBlocked: boolean;
  isBlacklisted: boolean;
  stats: {
    label: string;
    value: number | string;
  }[];
}) {
  const initials =
    name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}

          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {roleLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={image} alt={name} />

            <AvatarFallback className="font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold text-foreground">
                {name}
              </p>

              <EntityStatus
                isBlocked={isBlocked}
                isBlacklisted={isBlacklisted}
              />
            </div>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {email}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 divide-x rounded-lg border bg-muted/20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-3 py-2.5 first:pl-3 last:pl-4"
            >
              <p className="text-[11px] font-medium text-muted-foreground">
                {stat.label}
              </p>

              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  icon,
  label,
  description,
  variant = 'outline',
  destructive = false,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  variant?: 'outline' | 'default';
  destructive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className={`h-auto min-h-[58px] justify-start gap-3 px-3 py-2.5 text-left ${
        destructive
          ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-400'
          : ''
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          destructive
            ? 'bg-red-50 dark:bg-red-950'
            : 'bg-muted'
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-medium">
          {label}
        </span>

        <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </Button>
  );
}

function buildActionOptions(
  worker: WorkerSummary,
  user: UserSummary,
): {
  value: DisputeActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  destructive?: boolean;
}[] {
  const options: {
    value: DisputeActionType;
    label: string;
    description: string;
    icon: React.ReactNode;
    destructive?: boolean;
  }[] = [];

  options.push({
    value: 'warning_email_worker' as DisputeActionType,
    label: 'Warn Worker',
    description: 'Send an official warning email',
    icon: <MailWarning className="h-4 w-4" />,
  });

  options.push({
    value: 'warning_email_user' as DisputeActionType,
    label: 'Warn Client',
    description: 'Send an official warning email',
    icon: <MailWarning className="h-4 w-4" />,
  });

  options.push(
    worker.isBlocked
      ? {
          value: 'unblock_worker' as DisputeActionType,
          label: 'Unblock Worker',
          description: 'Restore worker account access',
          icon: <ShieldOff className="h-4 w-4" />,
        }
      : {
          value: 'block_worker' as DisputeActionType,
          label: 'Block Worker',
          description: 'Temporarily restrict worker access',
          icon: <Ban className="h-4 w-4" />,
          destructive: true,
        },
  );

  options.push(
    worker.isBlacklisted
      ? {
          value: 'unblacklist_worker' as DisputeActionType,
          label: 'Remove Worker Blacklist',
          description: 'Remove permanent restriction',
          icon: <ShieldOff className="h-4 w-4" />,
        }
      : {
          value: 'blacklist_worker' as DisputeActionType,
          label: 'Blacklist Worker',
          description: 'Permanently restrict worker',
          icon: <ShieldAlert className="h-4 w-4" />,
          destructive: true,
        },
  );

  options.push(
    user.isBlocked
      ? {
          value: 'unblock_user' as DisputeActionType,
          label: 'Unblock Client',
          description: 'Restore client account access',
          icon: <ShieldOff className="h-4 w-4" />,
        }
      : {
          value: 'block_user' as DisputeActionType,
          label: 'Block Client',
          description: 'Temporarily restrict client access',
          icon: <Ban className="h-4 w-4" />,
          destructive: true,
        },
  );

  options.push(
    user.isBlacklisted
      ? {
          value: 'unblacklist_user' as DisputeActionType,
          label: 'Remove Client Blacklist',
          description: 'Remove permanent restriction',
          icon: <ShieldOff className="h-4 w-4" />,
        }
      : {
          value: 'blacklist_user' as DisputeActionType,
          label: 'Blacklist Client',
          description: 'Permanently restrict client',
          icon: <ShieldAlert className="h-4 w-4" />,
          destructive: true,
        },
  );

  options.push({
    value: 'no_action' as DisputeActionType,
    label: 'Dismiss Dispute',
    description: 'Close this dispute without action',
    icon: <XCircle className="h-4 w-4" />,
  });

  return options;
}

function DisputePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [1];

  if (page > 3) {
    pages.push('ellipsis');
  }

  for (
    let p = Math.max(2, page - 1);
    p <= Math.min(totalPages - 1, page + 1);
    p++
  ) {
    pages.push(p);
  }

  if (page < totalPages - 2) {
    pages.push('ellipsis');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();

              if (page > 1) {
                onPageChange(page - 1);
              }
            }}
            className={
              page === 1
                ? 'pointer-events-none opacity-50'
                : ''
            }
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();

              if (page < totalPages) {
                onPageChange(page + 1);
              }
            }}
            className={
              page === totalPages
                ? 'pointer-events-none opacity-50'
                : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [actionTargetFilter, setActionTargetFilter] =
    useState<ActionTargetFilter>('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [detail, setDetail] =
    useState<DisputeDetail | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [actionType, setActionType] =
    useState<DisputeActionType | ''>('');

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const [confirmAction, setConfirmAction] =
    useState<DisputeActionType | null>(null);

  const loadDisputes = useCallback(async () => {
    setLoading(true);

    try {
      const res = await DisputeService.getAllDisputes({
        page,
        limit: ITEMS_PER_PAGE,
        status: statusFilter,
        actionTarget: actionTargetFilter,
      });

      const data = res.data.data;

      setDisputes(data?.disputes || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
    } catch {
      setDisputes([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, actionTargetFilter]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, actionTargetFilter]);

  const openDispute = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setActionType('');
    setReason('');
    setError(null);
    setDetailLoading(true);

    try {
      const res =
        await DisputeService.getDisputeById(id);

      setDetail(res.data.data);
    } catch {
      setError(
        'Failed to load dispute details.',
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
    setActionType('');
    setReason('');
    setError(null);
  };

  const executeAction = async () => {
    if (!detail) return;

    if (!actionType) {
      setError('Please select an action.');
      return;
    }

    if (reason.trim().length < 5) {
      setError(
        'Please provide a reason (min 5 characters).',
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await DisputeService.applyAction(detail.id, {
        actionType,
        reason: reason.trim(),
      });

      setConfirmAction(null);
      closeModal();

      await loadDisputes();
    } catch (err) {
      setError(
        getErrorMessage(err) ||
          'Failed to apply action. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAction =
    detail && confirmAction
      ? buildActionOptions(
          detail.worker,
          detail.user,
        ).find(
          (action) =>
            action.value === confirmAction,
        )
      : undefined;

  return (
    <div className="mx-auto w-full space-y-6 p-4 md:p-6">
      {/* =========================================================
          FILTER BAR
          One Tabs component + one Action Target Select
      ========================================================= */}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger
              value="all"
              className="flex-1 sm:flex-none"
            >
              All
            </TabsTrigger>

            <TabsTrigger
              value="pending"
              className="flex-1 sm:flex-none"
            >
              Pending
            </TabsTrigger>

            <TabsTrigger
              value="resolved"
              className="flex-1 sm:flex-none"
            >
              Resolved
            </TabsTrigger>

            <TabsTrigger
              value="dismissed"
              className="flex-1 sm:flex-none"
            >
              Dismissed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={actionTargetFilter}
          onValueChange={(value) =>
            setActionTargetFilter(
              value as ActionTargetFilter,
            )
          }
        >
          <SelectTrigger className="w-full sm:w-[210px]">
            <SelectValue placeholder="Action target" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All action targets
            </SelectItem>

            <SelectItem value="worker">
              Action against worker
            </SelectItem>

            <SelectItem value="user">
              Action against client
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* =========================================================
          HEADER / REFRESH
      ========================================================= */}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={loadDisputes}
          disabled={loading}
          className="w-fit"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading ? 'animate-spin' : ''
            }`}
          />

          Refresh
        </Button>

        {!loading && (
          <p className="text-sm text-muted-foreground">
            {total} dispute{total !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* =========================================================
          DISPUTES
      ========================================================= */}

      {loading ? (
        <Card className="shadow-none">
          <CardContent className="flex min-h-[280px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

              <p className="text-sm text-muted-foreground">
                Loading disputes...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : disputes.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">
              No disputes found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              There are no disputes matching the selected filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden shadow-none">
            <CardContent className="p-0">
              <div className="divide-y">
                {disputes.map((dispute) => (
                  <button
                    key={dispute.id}
                    type="button"
                    onClick={() =>
                      openDispute(dispute.id)
                    }
                    className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    {/* Icon */}

                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background sm:flex">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Main */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {dispute.workTitle}
                        </p>

                        <Badge
                          variant="secondary"
                          className="hidden sm:inline-flex"
                        >
                          {COMPLAINT_LABELS[
                            dispute.complaintType
                          ] ||
                            dispute.complaintType}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {COMPLAINT_LABELS[
                            dispute.complaintType
                          ] ||
                            dispute.complaintType}
                        </span>

                        <span>•</span>

                        <span>
                          {new Date(
                            dispute.createdAt,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Status */}

                    <div className="shrink-0">
                      <StatusBadge
                        status={dispute.status}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>

            <DisputePagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* =========================================================
          DETAIL DIALOG
      ========================================================= */}

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) =>
          !open && closeModal()
        }
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          {detailLoading || !detail ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  Loading dispute...
                </p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="border-b pb-5">
                <div className="flex flex-col gap-3 pr-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-xl">
                      {detail.workTitle}
                    </DialogTitle>

                    <DialogDescription className="mt-1">
                      Filed{' '}
                      {new Date(
                        detail.createdAt,
                      ).toLocaleString()}
                    </DialogDescription>
                  </div>

                  <StatusBadge
                    status={detail.status}
                  />
                </div>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* =================================================
                    COMPLAINT
                ================================================= */}

                <Card className="shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Complaint
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <Badge variant="secondary">
                      {COMPLAINT_LABELS[
                        detail.complaintType
                      ] ||
                        detail.complaintType}
                    </Badge>

                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {detail.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* =================================================
                    EVIDENCE
                ================================================= */}

                {(detail.proofImages.length > 0 ||
                  detail.proofVideo) && (
                  <Card className="shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Evidence
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {detail.proofImages.map(
                          (image) => (
                            <a
                              key={image}
                              href={image}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                            >
                              <img
                                src={image}
                                alt="Proof"
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            </a>
                          ),
                        )}

                        {detail.proofVideo && (
                          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                            <video
                              src={detail.proofVideo}
                              className="h-full w-full object-cover"
                              controls
                            />

                            <div className="pointer-events-none absolute left-2 top-2">
                              <Badge
                                variant="secondary"
                                className="gap-1 bg-background/90"
                              >
                                <Video className="h-3 w-3" />
                                Video
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* =================================================
                    PARTIES
                ================================================= */}

                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold">
                      Parties involved
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Review both accounts before taking action.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <EntityCard
                      icon={
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      }
                      roleLabel="Worker"
                      name={detail.worker.name}
                      email={detail.worker.email}
                      image={detail.worker.profileImage}
                      isBlocked={
                        detail.worker.isBlocked
                      }
                      isBlacklisted={
                        detail.worker.isBlacklisted
                      }
                      stats={[
                        {
                          label: 'Works completed',
                          value:
                            detail.worker
                              .totalWorksCompleted,
                        },
                        {
                          label: 'Actions',
                          value:
                            detail.worker
                              .totalActionsTaken,
                        },
                      ]}
                    />

                    <EntityCard
                      icon={
                        <UserRound className="h-4 w-4 text-muted-foreground" />
                      }
                      roleLabel="Client"
                      name={detail.user.name}
                      email={detail.user.email}
                      image={detail.user.profileImage}
                      isBlocked={
                        detail.user.isBlocked
                      }
                      isBlacklisted={
                        detail.user.isBlacklisted
                      }
                      stats={[
                        {
                          label: 'Actions',
                          value:
                            detail.user
                              .totalActionsTaken,
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* =================================================
                    PREVIOUS ACTIONS
                ================================================= */}

                {detail.actions.length > 0 && (
                  <Card className="shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        Previous actions
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        {detail.actions.map(
                          (action, index) => (
                            <div
                              key={`${action.actionType}-${action.takenAt}-${index}`}
                              className="relative flex gap-3"
                            >
                              {index <
                                detail.actions.length -
                                  1 && (
                                <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
                              )}

                              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>

                              <div className="min-w-0 flex-1 rounded-lg border bg-muted/20 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium capitalize text-foreground">
                                    {action.actionType.replace(
                                      /_/g,
                                      ' ',
                                    )}
                                  </span>

                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      action.takenAt,
                                    ).toLocaleString()}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  {action.reason}
                                </p>

                                <p className="mt-2 text-xs text-muted-foreground">
                                  Taken by{' '}
                                  {action.takenBy}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <Card className="border-dashed shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ShieldAlert className="h-4 w-4" />
                      Take action
                    </CardTitle>

                    <p className="text-xs text-muted-foreground">
                      Select an action and provide a clear reason
                      before applying it.
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {buildActionOptions(
                        detail.worker,
                        detail.user,
                      ).map((action) => (
                        <ActionButton
                          key={action.value}
                          icon={action.icon}
                          label={action.label}
                          description={
                            action.description
                          }
                          destructive={
                            action.destructive
                          }
                          variant={
                            actionType ===
                            action.value
                              ? 'default'
                              : 'outline'
                          }
                          disabled={submitting}
                          onClick={() => {
                            setActionType(
                              action.value,
                            );
                            setError(null);
                          }}
                        />
                      ))}
                    </div>

                    {actionType && (
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

                          <p className="text-sm font-medium text-foreground">
                            Selected:{' '}
                            {
                              buildActionOptions(
                                detail.worker,
                                detail.user,
                              ).find(
                                (action) =>
                                  action.value ===
                                  actionType,
                              )?.label
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Reason
                        </label>

                        <span className="text-xs text-muted-foreground">
                          {reason.length}/500
                        </span>
                      </div>

                      <Textarea
                        value={reason}
                        onChange={(event) => {
                          if (
                            event.target.value
                              .length <= 500
                          ) {
                            setReason(
                              event.target.value,
                            );
                          }
                        }}
                        placeholder="Explain why this action is being taken..."
                        rows={4}
                        className="resize-none"
                      />

                      {error && (
                        <p className="text-sm font-medium text-destructive">
                          {error}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* =================================================
                  DIALOG FOOTER
              ================================================= */}

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Close
                </Button>

                <Button
                  onClick={() => {
                    if (!actionType) {
                      setError(
                        'Please select an action.',
                      );
                      return;
                    }

                    if (reason.trim().length < 5) {
                      setError(
                        'Please provide a reason (min 5 characters).',
                      );
                      return;
                    }

                    setConfirmAction(
                      actionType,
                    );
                  }}
                  disabled={
                    submitting ||
                    !actionType ||
                    reason.trim().length < 5
                  }
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  Apply Action
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================
          CONFIRMATION
      ========================================================= */}

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) =>
          !open && setConfirmAction(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm action
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to{' '}
              <strong>
                {selectedAction?.label.toLowerCase()}
              </strong>
              ? This action will be recorded against this
              dispute.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                executeAction();
              }}
              disabled={submitting}
              className={
                selectedAction?.destructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}