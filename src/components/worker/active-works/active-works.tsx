import { WorkService } from "@/services/work-service";
import { ChatService } from "@/services/chat-service";
import { socketService } from "@/services/chat-socket-service";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, MapPin, Briefcase, IndianRupeeIcon,
  Wrench, TrendingUp, Flag, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { notifyWorkCompleted } from "@/utils/work-completion-helper";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/utils/error-helper";
import type { Chat } from "../messages/types/messages.types";

interface Work {
  id: string;
  userId: string;
  workTitle: string;
  workCategory: string;
  workType: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  manualAddress?: string;
  landmark?: string;
  budget?: number;
  status?: string;
  progress?: string;  // 'started' | 'ongoing' | 'completed'
  createdAt?: Date;
  updatedAt?: Date;
}

interface UpdateWorkPayload {
  progress: string;
  status?: string;
}

// Progress step config
const PROGRESS_STEPS = [
  {
    value: 'started',
    label: 'Started',
    Icon: Wrench,
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
  },
  {
    value: 'ongoing',
    label: 'In Progress',
    Icon: TrendingUp,
    color: 'bg-amber-500',
    textColor: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
  },
  {
    value: 'completed',
    label: 'Completed',
    Icon: Flag,
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/40',
    border: 'border-green-200 dark:border-green-900',
  },
];

const ITEMS_PER_PAGE = 6;

function ProgressTracker({
  progress,
  onProgressChange,
  disabled,
}: {
  progress?: string;
  onProgressChange: (p: string) => void;
  disabled?: boolean;
}) {
  const currentIdx = PROGRESS_STEPS.findIndex(s => s.value === progress);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Work Progress</Label>
      <div className="flex items-center gap-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const done = currentIdx >= idx;
          const active = currentIdx === idx;
          const { Icon } = step;
          return (
            <div key={step.value} className="flex items-center flex-1">
              <button
                disabled={disabled || idx > currentIdx + 1}
                onClick={() => !disabled && onProgressChange(step.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${active
                  ? `${step.bg} ${step.border} ${step.textColor}`
                  : done
                    ? 'bg-muted border-border text-muted-foreground'
                    : 'bg-card border-border text-muted-foreground/60 hover:border-muted-foreground/40'
                  } ${disabled || idx > currentIdx + 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{step.label}</span>
              </button>
              {idx < PROGRESS_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 rounded ${done && currentIdx > idx ? 'bg-muted-foreground/50' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
      {!progress && (
        <p className="text-xs text-muted-foreground">Click a step to update work progress</p>
      )}
    </div>
  );
}

interface ProgressConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newProgress: string;
  workTitle: string;
  isSubmitting: boolean;
}

function ProgressConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  newProgress,
  workTitle,
  isSubmitting,
}: ProgressConfirmDialogProps) {
  const step = PROGRESS_STEPS.find(s => s.value === newProgress);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            Mark <strong>{workTitle}</strong> as <strong>{step?.label}</strong>?
            This will notify the client in real-time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WorkCardProps {
  work: Work;
  onProgressUpdate: (work: Work, newProgress: string) => void;
  onChatWithUser: (work: Work) => void;
  getStatusColor: (status?: string) => string;
}

function WorkCard({ work, onProgressUpdate, onChatWithUser, getStatusColor }: WorkCardProps) {
  const currentProgressIdx = PROGRESS_STEPS.findIndex(s => s.value === work.progress);
  const currentStep = PROGRESS_STEPS[currentProgressIdx];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{work.workTitle}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline">
                  <Briefcase className="mr-1 h-3 w-3" />
                  {work.workCategory}
                </Badge>
                <Badge variant="outline">{work.workType}</Badge>
                {work.status && (
                  <Badge variant="outline" className={getStatusColor(work.status)}>
                    {work.status}
                  </Badge>
                )}
                {work.progress && currentStep && (
                  <Badge variant="outline" className={`${currentStep.bg} ${currentStep.border} ${currentStep.textColor}`}>
                    <currentStep.Icon className="mr-1 h-3 w-3" />
                    {currentStep.label}
                  </Badge>
                )}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dates & Budget */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {work.startDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Start:</span>
              <span>{new Date(work.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {work.endDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">End:</span>
              <span>{new Date(work.endDate).toLocaleDateString()}</span>
            </div>
          )}
          {work.budget && (
            <div className="flex items-center gap-2 text-sm">
              <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-semibold">₹{work.budget}</span>
            </div>
          )}
        </div>

        {/* Description / Address */}
        {(work.description || work.manualAddress) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {work.description && (
              <div className="space-y-1">
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground line-clamp-2">{work.description}</p>
              </div>
            )}
            {work.manualAddress && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{work.manualAddress}</span>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Progress Tracker */}
        <ProgressTracker
          progress={work.progress}
          onProgressChange={(p) => onProgressUpdate(work, p)}
          disabled={work.status === 'completed' || work.progress === 'completed'}
        />

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => onChatWithUser(work)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chat with Client
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActiveWorks() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progress update dialog state
  const [progressDialog, setProgressDialog] = useState<{
    work: Work;
    newProgress: string;
  } | null>(null);
  const [progressSubmitting, setProgressSubmitting] = useState(false);

  // ── Tabs + pagination state ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('started');
  const [currentPage, setCurrentPage] = useState(1);

  const user = AuthHelper.getUser();
  const userId = user?.id || AuthHelper.getUserId();
  const token = AuthHelper.getAccessToken();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400';
      case 'active': return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400';
      case 'assigned': return 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-400';
      case 'pending': return 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-400';
      case 'cancelled': return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400';
      default: return 'border-border bg-muted text-muted-foreground';
    }
  };



  const fetchAssignedWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await WorkService.getWorkerAssignedWorks();

      if (res.data.success) {
        setWorks(res.data.data || []);
      } else {
        setError('Failed to load assigned works');
      }
    } catch (err) {
      console.error('Error fetching assigned works:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedWorks();
  }, [fetchAssignedWorks]);

  // ── Real-time progress updates from socket ────────────────────────────────
  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    const handleProgressChange = ({ workId, progress }: { workId: string; progress: string }) => {
      setWorks(prev =>
        prev.map(w => w.id === workId ? { ...w, progress } : w)
      );
    };

    socketService.onWorkProgressChanged(handleProgressChange);
    return () => {
      socketService.offWorkProgressChanged(handleProgressChange);
    };
  }, [token]);

  // ── Bucket a work into one of the 3 tabs ──────────────────────────────────
  // Works with no progress set yet (just assigned) are treated as "started"
  // so nothing silently disappears from all tabs.
  const getWorkBucket = (work: Work) => work.progress || 'started';

  // ── Tab counts (computed off the full works list, not the paginated one) ──
  const tabCounts = useMemo(() => {
    return PROGRESS_STEPS.reduce<Record<string, number>>((acc, step) => {
      acc[step.value] = works.filter(w => getWorkBucket(w) === step.value).length;
      return acc;
    }, {});
  }, [works]);

  // ── Works filtered by the active tab ───────────────────────────────────────
  const filteredWorks = useMemo(() => {
    return works.filter(w => getWorkBucket(w) === activeTab);
  }, [works, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / ITEMS_PER_PAGE));

  // Keep currentPage in range whenever the filtered list shrinks/grows
  // (e.g. after a progress update moves a work to another tab).
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedWorks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWorks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWorks, currentPage]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  // ── Handle progress step click ────────────────────────────────────────────
  const handleProgressUpdate = (work: Work, newProgress: string) => {
    // Don't allow going backwards
    const currentIdx = PROGRESS_STEPS.findIndex(s => s.value === work.progress);
    const newIdx = PROGRESS_STEPS.findIndex(s => s.value === newProgress);
    if (newIdx < currentIdx) return;

    setProgressDialog({ work, newProgress });
  };

  const confirmProgressUpdate = async () => {
    if (!progressDialog) return;
    const { work, newProgress } = progressDialog;

    setProgressSubmitting(true);
    try {
      // 1. Update work status/progress in DB
      const updatePayload: UpdateWorkPayload = { progress: newProgress };
      if (newProgress === 'completed') {
        updatePayload.status = 'completed';
      } else {
        updatePayload.status = 'in-progress';
      }
      await WorkService.updateWork(work.id, updatePayload);
      
      if (newProgress === 'completed') {
        await notifyWorkCompleted(work.id);
      }

      // 2. Find (or create) chat between this worker and the work owner
      const chatsRes = await ChatService.getMyChats();
      const allChats: Chat[] = chatsRes.data.data || [];
      let chatId = allChats.find(
        (c) =>
          c.participants.userId === work.userId &&
          c.participants.workerId === userId
      )?.id;

      if (!chatId) {
        const chatRes = await ChatService.createChat({
          userId: work.userId,
          workerId: userId!,
        });
        chatId = chatRes.data.data?.id;
      }

      // 3. Emit socket progress event
      if (chatId) {
        await socketService.updateWorkProgress({
          chatId,
          workId: work.id,
          workTitle: work.workTitle,
          progress: newProgress,
          workerId: userId!,
          userId: work.userId,
        });
      }

      // 4. Update local state
      setWorks(prev =>
        prev.map(w =>
          w.id === work.id
            ? {
                ...w,
                progress: newProgress,
                status: newProgress === 'completed' ? 'completed' : 'in-progress',
              }
            : w
        )
      );

      setProgressDialog(null);
    } catch (err) {
      console.error('Progress update error:', err);
      alert(getErrorMessage(err));
    } finally {
      setProgressSubmitting(false);
    }
  };

  // ── Chat with user ────────────────────────────────────────────────────────
  const handleChatWithUser = async (work: Work) => {
    try {
      const chatsRes = await ChatService.getMyChats();
      const allChats: Chat[] = chatsRes.data.data || [];
      const existingChat = allChats.find(
        (c) =>
          c.participants.userId === work.userId &&
          c.participants.workerId === userId
      );

      const chat = existingChat
        ? existingChat
        : (await ChatService.createChat({
            userId: work.userId,
            workerId: userId!,
          })).data.data;

      navigate('/worker/worker-dashboard/client-messages', {
        state: {
          chatId: chat.id,
          userId: work.userId,
          workId: work.id,
          workTitle: work.workTitle,
        },
      });
    } catch (err) {
      console.error('Chat error:', err);
      alert('Failed to open chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchAssignedWorks} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Works</h1>
          <p className="text-muted-foreground mt-2">
            No assigned works yet. Once a client confirms a deal, it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full">

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {PROGRESS_STEPS.map(step => (
            <TabsTrigger key={step.value} value={step.value} className="flex items-center gap-1.5">
              <step.Icon className="h-3.5 w-3.5" />
              {step.label}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {tabCounts[step.value] ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredWorks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No {PROGRESS_STEPS.find(s => s.value === activeTab)?.label.toLowerCase()} works right now.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 w-full">
            {paginatedWorks.map(work => (
              <WorkCard
                key={work.id}
                work={work}
                onProgressUpdate={handleProgressUpdate}
                onChatWithUser={handleChatWithUser}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Progress confirmation dialog */}
      {progressDialog && (
        <ProgressConfirmDialog
          isOpen
          onClose={() => setProgressDialog(null)}
          onConfirm={confirmProgressUpdate}
          newProgress={progressDialog.newProgress}
          workTitle={progressDialog.work.workTitle}
          isSubmitting={progressSubmitting}
        />
      )}
    </div>
  );
}