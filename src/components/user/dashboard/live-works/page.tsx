import { ChatService } from "@/services/chat-service";
import { socketService } from "@/services/chat-socket-service";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, MapPin, Briefcase, IndianRupeeIcon,
  Wrench, TrendingUp, Flag, MessageSquare, Clock,
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
import { useLiveWorks, type LiveWork } from "@/hooks/useLiveWorks";

type LiveTab = 'active' | 'completed';

const TAB_CONFIG: { value: LiveTab; label: string; Icon: any }[] = [
  { value: 'active', label: 'Active', Icon: TrendingUp },
  { value: 'completed', label: 'Completed', Icon: Flag },
];

// Full 3-step tracker — a completed work now shows up on this page too,
// so "Completed" needs to render as a real step, not just an empty state.
const PROGRESS_STEPS = [
  { value: 'started', label: 'Started', Icon: Wrench, textColor: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900' },
  { value: 'ongoing', label: 'In Progress', Icon: TrendingUp, textColor: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900' },
  { value: 'completed', label: 'Completed', Icon: Flag, textColor: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-900' },
];

const ITEMS_PER_PAGE = 6;

function ProgressDisplay({ progress }: { progress?: string }) {
  const currentIdx = PROGRESS_STEPS.findIndex(s => s.value === progress);

  if (currentIdx === -1) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Waiting for worker to start…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Work Progress</Label>
      <div className="flex items-center gap-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const done = currentIdx >= idx;
          const active = currentIdx === idx;
          const { Icon } = step;
          return (
            <div key={step.value} className="flex items-center flex-1">
              <div
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                  active ? `${step.bg} ${step.border} ${step.textColor}` : done ? 'bg-muted border-border text-muted-foreground' : 'bg-background border-border text-muted-foreground/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{step.label}</span>
              </div>
              {idx < PROGRESS_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 rounded ${done && currentIdx > idx ? 'bg-muted-foreground/40' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
      {progress && (
        <p className="text-xs text-muted-foreground">
          {progress === 'started' && '🔧 Worker has started the job'}
          {progress === 'ongoing' && '⚙️ Work is currently in progress'}
          {progress === 'completed' && '☑ Work has been completed!'}
        </p>
      )}
    </div>
  );
}

function LiveWorkCard({
  work,
  onChatWithWorker,
  getStatusColor,
}: {
  work: LiveWork;
  onChatWithWorker: (work: LiveWork) => void;
  getStatusColor: (status?: string) => string;
}) {
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
        <ProgressDisplay progress={work.progress} />
        <Separator />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={() => onChatWithWorker(work)} className="flex items-center gap-2">
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
  const [activeTab, setActiveTab] = useState<LiveTab>('active');
  const [currentPage, setCurrentPage] = useState(1);

  const token = AuthHelper.getAccessToken();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const { works, pagination, counts, loading, error, refetch } = useLiveWorks({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    bucket: activeTab,
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'assigned': return 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-400';
      case 'in-progress': return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400';
      case 'completed': return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400';
      default: return 'border-border bg-muted text-muted-foreground';
    }
  };

  // Any progress change — including completion, which moves a work from the
  // Active tab to the Completed tab — is simplest handled by a refetch.
  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    const handleProgressChange = () => {
      refetch();
    };

    socketService.onWorkProgressChanged(handleProgressChange);
    return () => {
      socketService.offWorkProgressChanged(handleProgressChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const totalPages = pagination.totalPages;
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const handleChatWithWorker = async (work: LiveWork) => {
    try {
      const chatsRes = await ChatService.getMyChats();
      const allChats = chatsRes.data.data || [];
      if (allChats.length > 0) {
        navigate('/user/user-dashboard/messages', {
          state: { workTitle: work.workTitle, workId: work.id },
        });
      } else {
        alert('No active chats found for this work.');
      }
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  if (loading && works.length === 0 && counts.active === 0 && counts.completed === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={refetch} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (counts.active === 0 && counts.completed === 0) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Works</h1>
          <p className="text-muted-foreground mt-2">
            No works yet. Once a worker confirms a deal, it will appear here for live tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LiveTab)}>
        <TabsList>
          {TAB_CONFIG.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
              <tab.Icon className="h-3.5 w-3.5" />
              {tab.label}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {counts[tab.value] ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No {TAB_CONFIG.find(t => t.value === activeTab)?.label.toLowerCase()} works right now.
          </p>
        </div>
      ) : (
        <>
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

          {pagination.totalPages > 1 && (
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
                      if (currentPage < pagination.totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}