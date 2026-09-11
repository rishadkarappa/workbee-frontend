import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquareWarning,
  ShieldCheck,
  CalendarDays,
  FileWarning,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  Clock3,
  List,
} from 'lucide-react';

import { DisputeService } from '@/services/dispute-service';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';

interface DisputeActionItem {
  actionType: string;
  reason: string;
  takenBy: string;
  takenAt: string;
}

interface Dispute {
  id: string;
  workTitle: string;
  complaintType: string;
  description: string;
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
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
  in_review: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

type TabValue =
  | 'all'
  | 'pending'
  | 'resolved'
  | 'dismissed'
  | 'against_me';

const TABS = [
  {
    value: 'all' as const,
    label: 'All',
    Icon: List,
  },
  {
    value: 'pending' as const,
    label: 'Pending',
    Icon: Clock3,
  },
  {
    value: 'resolved' as const,
    label: 'Resolved',
    Icon: CheckCircle2,
  },
  {
    value: 'dismissed' as const,
    label: 'Dismissed',
    Icon: XCircle,
  },
  {
    value: 'against_me' as const,
    label: 'Action Against Me',
    Icon: ShieldAlert,
  },
];

const PAGE_SIZE = 5;


function DisputeRow({ dispute }: { dispute: Dispute }) {
  const [expanded, setExpanded] = useState(false);

  const complaintLabel =
    COMPLAINT_LABELS[dispute.complaintType] || dispute.complaintType;

  return (
    <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">

      {/* Collapsed Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40">

          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <MessageSquareWarning className="h-5 w-5 text-red-500 dark:text-red-400" />
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

          {/* Right */}
          <div className="flex shrink-0 items-center gap-3">

            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[dispute.status]
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

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-5 border-t bg-muted/30 px-4 pb-5">

          {/* Complaint Details */}
          <div className="pt-4">

            <div className="mb-2 flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-muted-foreground" />

              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Complaint Details
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Complaint Type
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {complaintLabel}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[dispute.status]
                      }`}
                  >
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>

              </div>

              {/* Description */}
              <div className="mt-4 border-t pt-4">

                <p className="text-xs font-medium text-muted-foreground">
                  Complaint Description
                </p>

                <p className="mt-1 text-sm leading-6 text-foreground/80">
                  {dispute.description}
                </p>

              </div>
            </div>
          </div>

          {/* Actions Taken */}
          {dispute.actions.length > 0 && (
            <div>

              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />

                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions Taken
                </p>
              </div>

              <div className="space-y-2">

                {dispute.actions.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-card p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="text-sm font-medium capitalize text-foreground">
                          {action.actionType.replace(/_/g, ' ')}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {action.reason}
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Admin
                      </span>

                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />

                      {new Date(action.takenAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                  </div>
                ))}

              </div>
            </div>
          )}

          {/* Filed Date */}
          <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">

            <CalendarDays className="h-3.5 w-3.5" />

            <span>
              Complaint filed on{' '}
              {new Date(dispute.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

          </div>

        </div>
      )}
    </div>
  );
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

  // Build a compact page list with ellipses
  const pages: (number | 'ellipsis')[] = [];
  const addPage = (p: number) => pages.push(p);

  addPage(1);
  if (page > 3) pages.push('ellipsis');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    addPage(p);
  }
  if (page < totalPages - 2) pages.push('ellipsis');
  if (totalPages > 1) addPage(totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
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
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default function WorkerDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    DisputeService.getWorkerDisputes()
      .then((res) => setDisputes(res.data.data || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtered list for the active tab
  const filteredDisputes = useMemo(() => {
    if (activeTab === 'all') {
      return disputes;
    }

    if (activeTab === 'against_me') {
      return disputes.filter((d) =>
        d.actions.some((a) => a.actionType.endsWith('_worker'))
      );
    }

    return disputes.filter((d) => d.status === activeTab);
  }, [disputes, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredDisputes.length / PAGE_SIZE));

  const paginatedDisputes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDisputes.slice(start, start + PAGE_SIZE);
  }, [filteredDisputes, page]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    setPage(1);
  };

  const tabCounts = useMemo(() => {
    return {
      all: disputes.length,

      pending: disputes.filter(
        (dispute) => dispute.status === 'pending'
      ).length,

      resolved: disputes.filter(
        (dispute) => dispute.status === 'resolved'
      ).length,

      dismissed: disputes.filter(
        (dispute) => dispute.status === 'dismissed'
      ).length,

      against_me: disputes.filter((dispute) =>
        dispute.actions.some((action) =>
          action.actionType.endsWith('_worker')
        )
      ).length,
    };
  }, [disputes]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div className="w-full space-y-4 p-4 sm:p-6">

      {/* Header */}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5 sm:w-fit sm:inline-grid">
          {TABS.map((tab) => {
            const { Icon } = tab;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />

                <span>{tab.label}</span>

                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0 text-xs"
                >
                  {tabCounts[tab.value]}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {filteredDisputes.length === 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center">

          <MessageSquareWarning className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />

          <p className="text-sm text-muted-foreground">
            No complaints found for this filter.
          </p>

        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedDisputes.map((dispute) => (
              <DisputeRow
                key={dispute.id}
                dispute={dispute}
              />
            ))}
          </div>

          <div className="pt-2">
            <DisputePagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

    </div>
  );
}