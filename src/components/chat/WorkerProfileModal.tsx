import { useEffect, useState } from 'react';
import { Star, User, CheckCircle2 } from 'lucide-react';
import { ReviewService } from '@/services/review-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WorkerProfileStats {
  id: string;
  name: string;
  workerProfileImage?: string;
  totalWorksCompleted: number;
  avgRating: number;
  totalReviews: number;
  testimonials: { rating: number; testimonial?: string; createdAt: string }[];
}

interface WorkerProfileModalProps {
  open: boolean;
  onClose: () => void;
  workerId: string;
}

export default function WorkerProfileModal({ open, onClose, workerId }: WorkerProfileModalProps) {
  const [stats, setStats] = useState<WorkerProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !workerId) return;
    setLoading(true);
    setError(null);
    ReviewService.getWorkerProfileStats(workerId)
      .then(res => setStats(res.data.data))
      .catch(() => setError('Failed to load worker profile.'))
      .finally(() => setLoading(false));
  }, [open, workerId]);

  const initials = stats?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showScroll = (stats?.testimonials.length ?? 0) > 4;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-110 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Worker profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : error || !stats ? (
          <p className="text-sm text-destructive text-center py-8">{error || 'Worker not found.'}</p>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-25 h-25">
                <AvatarImage src={stats.workerProfileImage} alt={stats.name} />
                <AvatarFallback>
                  {initials || <User className="w-8 h-8 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-base font-semibold mt-3">{stats.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-6 h-6 fill-foreground text-foreground" />
                {/* <Star className="w-4 h-4 fill-foreground text-foreground" /> */}
                <span className="text-sm font-medium">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'No ratings yet'}
                </span>
                {stats.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">({stats.totalReviews} reviews)</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 bg-muted rounded py-3 mt-1">
              <CheckCircle2 className="w-5 h-5 text-green-800" />
              <span className="text-sm">
                <span className="font-semibold">{stats.totalWorksCompleted}</span> works completed
              </span>
            </div>

            <div className={cn('mt-4', showScroll ? 'flex-1 min-h-0' : '')}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Testimonials
              </p>
              {stats.testimonials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No testimonials yet</p>
              ) : showScroll ? (
                <ScrollArea className="h-64 pr-3">
                  <TestimonialList testimonials={stats.testimonials} />
                </ScrollArea>
              ) : (
                <TestimonialList testimonials={stats.testimonials} />
              )}
            </div>
          </>
        )}

        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="px-4 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestimonialList({ testimonials }: { testimonials: WorkerProfileStats['testimonials'] }) {
  return (
    <div className="space-y-3">
      {testimonials.map((t, idx) => (
        <div key={idx} className="bg-muted rounded-xl p-3">
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={cn(
                  'w-5.5 h-5.5',
                  s <= t.rating
                    ? 'fill-foreground text-foreground'
                    : 'text-muted-foreground/25'
                )}
              />
            ))}
          </div>
          <p className="text-sm text-foreground">{t.testimonial}</p>
        </div>
      ))}
    </div>
  );
}