
import { WorkService } from "@/services/work-service";
import { socketService } from "@/services/socket-service";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, MapPin, Briefcase, IndianRupeeIcon,
  Wrench, TrendingUp, Flag, MessageSquare, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ChatService } from "@/services/chat-service";

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

// Progress steps config (same as worker side — read-only here)
const PROGRESS_STEPS = [
  { value: 'started',   label: 'Started',     Icon: Wrench,     color: 'bg-blue-500',  textColor: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200' },
  { value: 'ongoing',   label: 'In Progress', Icon: TrendingUp, color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'completed', label: 'Completed',   Icon: Flag,       color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
];

function ProgressDisplay({ progress }: { progress?: string }) {
  const currentIdx = PROGRESS_STEPS.findIndex(s => s.value === progress);

  if (currentIdx === -1) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Waiting for worker to start…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">Work Progress</Label>
      <div className="flex items-center gap-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const done   = currentIdx >= idx;
          const active = currentIdx === idx;
          const { Icon } = step;
          return (
            <div key={step.value} className="flex items-center flex-1">
              <div
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                  active
                    ? `${step.bg} ${step.border} ${step.textColor}`
                    : done
                    ? 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'bg-white border-gray-200 text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{step.label}</span>
              </div>
              {idx < PROGRESS_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 rounded ${done && currentIdx > idx ? 'bg-gray-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {progress && (
        <p className="text-xs text-gray-500">
          {progress === 'started'   && '🔧 Worker has started the job'}
          {progress === 'ongoing'   && '⚙️ Work is currently in progress'}
          {progress === 'completed' && '✅ Work has been completed!'}
        </p>
      )}
    </div>
  );
}

interface WorkCardProps {
  work: Work;
  onChatWithWorker: (work: Work) => void;
  getStatusColor: (status?: string) => string;
}

function LiveWorkCard({ work, onChatWithWorker, getStatusColor }: WorkCardProps) {
  const currentStep = PROGRESS_STEPS.find(s => s.value === work.progress);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
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

        {work.manualAddress && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{work.manualAddress}</span>
          </div>
        )}

        <Separator />

        {/* Progress (read-only for user) */}
        <ProgressDisplay progress={work.progress} />

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => onChatWithWorker(work)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chat with Worker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveWorks() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user   = AuthHelper.getUser();
  const userId = user?.id || user?._id || AuthHelper.getUserId();
  const token  = AuthHelper.getAccessToken();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':  return 'border-green-200 bg-green-50 text-green-700';
      case 'assigned':   return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'active':     return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'pending':    return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'cancelled':  return 'border-red-200 bg-red-50 text-red-700';
      default:           return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const fetchLiveWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Get user's own works filtered to 'assigned' status (deal confirmed)
      const res = await WorkService.getMyWorks();
      if (res.data.success) {
        const allWorks = res.data.data?.works || [];
        // Show works that are assigned (deal accepted) or have progress
        const liveWorks = allWorks.filter(
          (w: Work) => w.status === 'assigned' || w.status === 'in-progress' || w.progress
        );
        setWorks(liveWorks);
      } else {
        setError('Failed to load live works');
      }
    } catch (err: any) {
      console.error('Error fetching live works:', err);
      setError(err.response?.data?.message || 'Failed to load works');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveWorks();
  }, [fetchLiveWorks]);

  // ── Real-time progress updates from socket ────────────────────────────────
  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    const handleProgressChange = ({ workId, progress }: { workId: string; progress: string }) => {
      setWorks(prev =>
        prev.map(w =>
          w.id === workId
            ? {
                ...w,
                progress,
                // Auto-update status to in-progress when worker starts/ongoing
                status: progress === 'completed' ? 'completed' : w.status === 'assigned' && progress ? 'in-progress' : w.status
              }
            : w
        )
      );
    };

    socketService.onWorkProgressChanged(handleProgressChange);
    return () => {
      socketService.offWorkProgressChanged(handleProgressChange);
    };
  }, [token]);

  // ── Chat with worker ──────────────────────────────────────────────────────
  const handleChatWithWorker = async (work: Work) => {
    try {
      // We need the workerId — fetch chats to find the related one
      const chatsRes = await ChatService.getMyChats();
      const allChats = chatsRes.data.data || [];

      // Find a chat that might be related (we match by work context if available)
      // Best approach: navigate to messages and let user pick
      if (allChats.length > 0) {
        navigate('/user/user-dashboard/messages', {
          state: {
            workTitle: work.workTitle,
            workId: work.id,
          },
        });
      } else {
        alert('No active chats found for this work.');
      }
    } catch (err) {
      console.error('Chat error:', err);
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
        <Button onClick={fetchLiveWorks} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Works</h1>
          <p className="text-muted-foreground mt-2">
            No active works yet. Once a worker confirms a deal, it will appear here for live tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Works</h1>
        <p className="text-muted-foreground mt-2">
          {works.length} work{works.length !== 1 ? 's' : ''} in progress — progress updates in real-time
        </p>
      </div>

      <div className="grid gap-4 w-full">
        {works.map(work => (
          <LiveWorkCard
            key={work.id}
            work={work}
            onChatWithWorker={handleChatWithWorker}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    </div>
  );
}