import { WorkService } from "@/services/work-service";
import { ChatService } from "@/services/chat-service";
import { socketService } from "@/services/socket-service";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit, Calendar, MapPin, Briefcase, IndianRupeeIcon,
  Wrench, TrendingUp, Flag, MessageSquare, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Progress step config
const PROGRESS_STEPS = [
  { value: 'started',   label: 'Started',     Icon: Wrench,     color: 'bg-blue-500',  textColor: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200' },
  { value: 'ongoing',   label: 'In Progress', Icon: TrendingUp, color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'completed', label: 'Completed',   Icon: Flag,       color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
];

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
      <Label className="text-sm font-medium text-gray-700">Work Progress</Label>
      <div className="flex items-center gap-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const done    = currentIdx >= idx;
          const active  = currentIdx === idx;
          const { Icon } = step;
          return (
            <div key={step.value} className="flex items-center flex-1">
              <button
                disabled={disabled || idx > currentIdx + 1}
                onClick={() => !disabled && onProgressChange(step.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                  active
                    ? `${step.bg} ${step.border} ${step.textColor}`
                    : done
                    ? 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                } ${disabled || idx > currentIdx + 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{step.label}</span>
              </button>
              {idx < PROGRESS_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 rounded ${done && currentIdx > idx ? 'bg-gray-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {!progress && (
        <p className="text-xs text-gray-400">Click a step to update work progress</p>
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

  const user   = AuthHelper.getUser();
  const userId = user?.id || user?._id || AuthHelper.getUserId();
  const token  = AuthHelper.getAccessToken();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':  return 'border-green-200 bg-green-50 text-green-700';
      case 'active':     return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'assigned':   return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'pending':    return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'cancelled':  return 'border-red-200 bg-red-50 text-red-700';
      default:           return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const fetchAssignedWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get ALL works and filter by assigned status
      // (WorkerWorksTable uses getAllWorks — for worker's own assigned works
      //  we use getAllWorks with a special worker filter OR a dedicated endpoint)
      // Using getAllWorks filtered to 'assigned' status — works the worker confirmed
      const res = await WorkService.getWorkerAssignedWorks();

      if (res.data.success) {
        setWorks(res.data.data?.works || []);
      } else {
        setError('Failed to load assigned works');
      }
    } catch (err: any) {
      console.error('Error fetching assigned works:', err);
      setError(err.response?.data?.message || 'Failed to load works');
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

  // ── Handle progress step click ────────────────────────────────────────────
  const handleProgressUpdate = (work: Work, newProgress: string) => {
    // Don't allow going backwards
    const currentIdx = PROGRESS_STEPS.findIndex(s => s.value === work.progress);
    const newIdx     = PROGRESS_STEPS.findIndex(s => s.value === newProgress);
    if (newIdx < currentIdx) return;

    setProgressDialog({ work, newProgress });
  };

  const confirmProgressUpdate = async () => {
    if (!progressDialog) return;
    const { work, newProgress } = progressDialog;

    setProgressSubmitting(true);
    try {
      // 1. Update work status/progress in DB
      const updatePayload: any = { progress: newProgress };
      if (newProgress === 'completed') {
        updatePayload.status = 'completed';
      }
      await WorkService.updateWork(work.id, updatePayload);

      // 2. Find chat between this worker and the work owner
      const chatsRes = await ChatService.getMyChats();
      const allChats = chatsRes.data.data || [];
      const relatedChat = allChats.find(
        (c: any) => c.participants.userId === work.userId
      );

      // 3. Emit socket progress event
      if (relatedChat) {
        await socketService.updateWorkProgress({
          chatId:    relatedChat.id,
          workId:    work.id,
          workTitle: work.workTitle,
          progress:  newProgress,
          workerId:  userId!,
        });
      }

      // 4. Update local state
      setWorks(prev =>
        prev.map(w =>
          w.id === work.id
            ? { ...w, progress: newProgress, status: newProgress === 'completed' ? 'completed' : w.status }
            : w
        )
      );

      setProgressDialog(null);
    } catch (err: any) {
      console.error('Progress update error:', err);
      alert(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setProgressSubmitting(false);
    }
  };

  // ── Chat with user ────────────────────────────────────────────────────────
  const handleChatWithUser = async (work: Work) => {
    try {
      const response = await ChatService.createChat({
        userId:   work.userId,
        workerId: userId!,
      });
      const chat = response.data.data;
      navigate('/worker/worker-dashboard/client-messages', {
        state: {
          chatId:    chat.id,
          userId:    work.userId,
          workId:    work.id,
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
        <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Works</h1>
        <p className="text-muted-foreground mt-2">
          {works.length} assigned work{works.length !== 1 ? 's' : ''} — update progress as you go
        </p>
      </div>

      <div className="grid gap-4 w-full">
        {works.map(work => (
          <WorkCard
            key={work.id}
            work={work}
            onProgressUpdate={handleProgressUpdate}
            onChatWithUser={handleChatWithUser}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>

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