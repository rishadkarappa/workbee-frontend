import { useState } from 'react';
import { Star } from 'lucide-react';
import { ReviewService } from '@/services/review-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface WorkerReviewModalProps {
  open: boolean;
  onClose: () => void;
  workId: string;
  workerId: string;
  workerName: string;
  workTitle: string;
}

export default function WorkerReviewModal({ open, onClose, workId, workerId, workerName, workTitle }: WorkerReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [testimonial, setTestimonial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await ReviewService.submitReview({ workId, workerId, rating, testimonial: testimonial.trim() || undefined });
      onClose();
    } catch {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate {workerName}</DialogTitle>
          <DialogDescription>How was the work on "{workTitle}"?</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Textarea
            value={testimonial}
            onChange={e => setTestimonial(e.target.value.slice(0, 500))}
            placeholder="Share a testimonial about this worker (optional)"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{testimonial.length}/500</p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Maybe Later
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}