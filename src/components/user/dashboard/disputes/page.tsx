// import { useEffect, useState } from 'react';
// import {
//   ChevronDown,
//   ChevronUp,
//   Loader2,
//   FileWarning,
//   CalendarDays,
//   ShieldCheck,
//   MessageSquareWarning,
// } from 'lucide-react';

// import { DisputeService } from '@/services/dispute-service';

// interface DisputeActionItem {
//   actionType: string;
//   reason: string;
//   takenBy: string;
//   takenAt: string;
// }

// interface Dispute {
//   id: string;
//   workTitle: string;
//   complaintType: string;
//   description: string;
//   proofImages: string[];
//   proofVideo?: string;
//   status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
//   actions: DisputeActionItem[];
//   createdAt: string;
// }

// const COMPLAINT_LABELS: Record<string, string> = {
//   against_worker: 'Against Worker',
//   about_work: 'About Work',
//   cleanliness: 'Cleanliness',
//   behavior: 'Behavior',
//   work_not_completed: 'Work Not Completed',
//   fraud_suspicion: 'Fraud Suspicion',
//   other: 'Other',
// };

// const STATUS_STYLES: Record<string, string> = {
//   pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
//   in_review: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
//   resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
//   dismissed: 'bg-muted text-muted-foreground border-border',
// };

// function DisputeRow({ dispute }: { dispute: Dispute }) {
//   const [expanded, setExpanded] = useState(false);

//   const complaintLabel =
//     COMPLAINT_LABELS[dispute.complaintType] || dispute.complaintType;

//   return (
//     <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">

//       {/* Collapsed Header */}
//       <button
//         type="button"
//         onClick={() => setExpanded(!expanded)}
//         className="w-full text-left"
//       >
//         <div className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40">

//           {/* Left */}
//           <div className="flex min-w-0 items-center gap-3">

//             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
//               <FileWarning className="h-5 w-5 text-destructive" />
//             </div>

//             <div className="min-w-0">
//               <p className="truncate text-sm font-semibold text-foreground">
//                 {dispute.workTitle}
//               </p>

//               <div className="mt-1 flex items-center gap-2">
//                 <span className="text-xs text-muted-foreground">
//                   {complaintLabel}
//                 </span>

//                 <span className="text-xs text-muted-foreground">•</span>

//                 <span className="text-xs text-muted-foreground">
//                   {new Date(dispute.createdAt).toLocaleDateString('en-IN', {
//                     day: 'numeric',
//                     month: 'short',
//                     year: 'numeric',
//                   })}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Right */}
//           <div className="flex shrink-0 items-center gap-3">

//             <span
//               className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
//                 STATUS_STYLES[dispute.status]
//               }`}
//             >
//               {dispute.status.replace('_', ' ')}
//             </span>

//             {expanded ? (
//               <ChevronUp className="h-4 w-4 text-muted-foreground" />
//             ) : (
//               <ChevronDown className="h-4 w-4 text-muted-foreground" />
//             )}
//           </div>
//         </div>
//       </button>

//       {/* Expanded Details */}
//       {expanded && (
//         <div className="space-y-5 border-t border-border bg-muted/40 px-4 pb-5">

//           {/* Complaint Details */}
//           <div className="pt-4">
//             <div className="mb-2 flex items-center gap-2">
//               <FileWarning className="h-4 w-4 text-muted-foreground" />

//               <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                 Complaint Details
//               </p>
//             </div>

//             <div className="rounded-lg border border-border bg-card p-4">
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

//                 <div>
//                   <p className="text-xs font-medium text-muted-foreground">
//                     Complaint Type
//                   </p>

//                   <p className="mt-1 text-sm font-medium text-foreground">
//                     {complaintLabel}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs font-medium text-muted-foreground">
//                     Status
//                   </p>

//                   <span
//                     className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
//                       STATUS_STYLES[dispute.status]
//                     }`}
//                   >
//                     {dispute.status.replace('_', ' ')}
//                   </span>
//                 </div>
//               </div>

//               <div className="mt-4 border-t border-border pt-4">
//                 <p className="text-xs font-medium text-muted-foreground">
//                   Description
//                 </p>

//                 <p className="mt-1 text-sm leading-6 text-foreground/80">
//                   {dispute.description}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Proof */}
//           {(dispute.proofImages.length > 0 || dispute.proofVideo) && (
//             <div>
//               <div className="mb-2 flex items-center gap-2">
//                 <ShieldCheck className="h-4 w-4 text-muted-foreground" />

//                 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                   Submitted Proof
//                 </p>
//               </div>

//               <div className="rounded-lg border border-border bg-card p-4">
//                 <div className="flex flex-wrap gap-3">

//                   {dispute.proofImages.map((img, index) => (
//                     <img
//                       key={`${img}-${index}`}
//                       src={img}
//                       alt={`Proof ${index + 1}`}
//                       className="h-24 w-24 rounded-lg border border-border object-cover transition-transform hover:scale-105"
//                     />
//                   ))}

//                   {dispute.proofVideo && (
//                     <video
//                       src={dispute.proofVideo}
//                       className="h-24 w-40 rounded-lg border border-border object-cover"
//                       controls
//                     />
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Admin Actions */}
//           {dispute.actions.length > 0 && (
//             <div>
//               <div className="mb-2 flex items-center gap-2">
//                 <ShieldCheck className="h-4 w-4 text-muted-foreground" />

//                 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                   Actions Taken
//                 </p>
//               </div>

//               <div className="space-y-2">
//                 {dispute.actions.map((action, index) => (
//                   <div
//                     key={index}
//                     className="rounded-lg border border-border bg-card p-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <p className="text-sm font-medium capitalize text-foreground">
//                           {action.actionType.replace(/_/g, ' ')}
//                         </p>

//                         <p className="mt-1 text-sm text-muted-foreground">
//                           {action.reason}
//                         </p>
//                       </div>

//                       <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
//                         Admin
//                       </span>
//                     </div>

//                     <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
//                       <CalendarDays className="h-3.5 w-3.5" />

//                       {new Date(action.takenAt).toLocaleString('en-IN', {
//                         day: 'numeric',
//                         month: 'short',
//                         year: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                       })}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Filed Date */}
//           <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
//             <CalendarDays className="h-3.5 w-3.5" />

//             <span>
//               Filed on{' '}
//               {new Date(dispute.createdAt).toLocaleString('en-IN', {
//                 day: 'numeric',
//                 month: 'short',
//                 year: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//               })}
//             </span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function Disputes() {
//   const [disputes, setDisputes] = useState<Dispute[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     DisputeService.getMyDisputes()
//       .then((res) => setDisputes(res.data.data || []))
//       .catch(() => setDisputes([]))
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex min-h-[50vh] items-center justify-center">
//         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }

//   return (
//     <div className="w-full space-y-4 p-4 sm:p-6">

//       {disputes.length === 0 ? (
//         <div className="rounded-xl border border-border bg-card py-12 text-center">
//           <MessageSquareWarning className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />

//           <p className="text-sm text-muted-foreground">
//             You haven't raised any complaints yet.
//           </p>
//         </div>
//       ) : (
//         disputes.map((dispute) => (
//           <DisputeRow
//             key={dispute.id}
//             dispute={dispute}
//           />
//         ))
//       )}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  FileWarning,
  CalendarDays,
  ShieldCheck,
  MessageSquareWarning,
  ListChecks,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
} from 'lucide-react';

import { DisputeService } from '@/services/dispute-service';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  proofImages: string[];
  proofVideo?: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  actions: DisputeActionItem[];
  createdAt: string;
  // True when this dispute was raised against the current user rather than
  // by them. Rename to match whatever field DisputeService.getMyDisputes()
  // actually returns (e.g. raisedAgainstMe, direction === 'against').
  isAgainstMe: boolean;
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
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
  in_review: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

type TabValue = 'all' | 'pending' | 'resolved' | 'dismissed';

const TAB_CONFIG: { value: TabValue; label: string; Icon: any }[] = [
  { value: 'all', label: 'All', Icon: ListChecks },
  { value: 'pending', label: 'Pending', Icon: Clock },
  { value: 'resolved', label: 'Resolved', Icon: CheckCircle2 },
  { value: 'dismissed', label: 'Dismissed', Icon: XCircle },
];

const ITEMS_PER_PAGE = 5;

function DisputeRow({ dispute }: { dispute: Dispute }) {
  const [expanded, setExpanded] = useState(false);

  const complaintLabel =
    COMPLAINT_LABELS[dispute.complaintType] || dispute.complaintType;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">

      {/* Collapsed Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40">

          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <FileWarning className="h-5 w-5 text-destructive" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {dispute.workTitle}
                </p>
                {dispute.isAgainstMe && (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                    Against You
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {complaintLabel}
                </span>

                <span className="text-xs text-muted-foreground">•</span>

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

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-5 border-t border-border bg-muted/40 px-4 pb-5">

          {/* Complaint Details */}
          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-muted-foreground" />

              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Complaint Details
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
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
                    className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                      STATUS_STYLES[dispute.status]
                    }`}
                  >
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>

                <p className="mt-1 text-sm leading-6 text-foreground/80">
                  {dispute.description}
                </p>
              </div>
            </div>
          </div>

          {/* Proof */}
          {(dispute.proofImages.length > 0 || dispute.proofVideo) && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />

                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted Proof
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap gap-3">

                  {dispute.proofImages.map((img, index) => (
                    <img
                      key={`${img}-${index}`}
                      src={img}
                      alt={`Proof ${index + 1}`}
                      className="h-24 w-24 rounded-lg border border-border object-cover transition-transform hover:scale-105"
                    />
                  ))}

                  {dispute.proofVideo && (
                    <video
                      src={dispute.proofVideo}
                      className="h-24 w-40 rounded-lg border border-border object-cover"
                      controls
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
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
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
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
          <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />

            <span>
              Filed on{' '}
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

  const pages: (number | 'ellipsis')[] = [1];
  if (page > 3) pages.push('ellipsis');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);

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

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    DisputeService.getMyDisputes()
      .then((res) => setDisputes(res.data.data || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 whenever the tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const tabCounts = useMemo(() => {
    return {
      all: disputes.length,
      pending: disputes.filter((d) => d.status === 'pending').length,
      resolved: disputes.filter((d) => d.status === 'resolved').length,
      dismissed: disputes.filter((d) => d.status === 'dismissed').length,
    };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return disputes.filter((d) => d.status === 'pending');
      case 'resolved':
        return disputes.filter((d) => d.status === 'resolved');
      case 'dismissed':
        return disputes.filter((d) => d.status === 'dismissed');
      case 'all':
      default:
        return disputes;
    }
  }, [disputes, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredDisputes.length / ITEMS_PER_PAGE));

  const paginatedDisputes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredDisputes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDisputes, page]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="w-full space-y-4 p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <MessageSquareWarning className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            You haven't raised any complaints yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 p-4 sm:p-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
              <tab.Icon className="h-3.5 w-3.5" />
              {tab.label}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {tabCounts[tab.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredDisputes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <MessageSquareWarning className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No {TAB_CONFIG.find((t) => t.value === activeTab)?.label.toLowerCase()} disputes.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedDisputes.map((dispute) => (
              <DisputeRow key={dispute.id} dispute={dispute} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filteredDisputes.length)} of {filteredDisputes.length}
            </p>
            <DisputePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}