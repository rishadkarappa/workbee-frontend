import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { ReviewService } from '@/services/review-service';

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

  if (!open) return null;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">Rate {workerName}</h3>
        <p className="text-sm text-gray-500 mb-4">How was the work on "{workTitle}"?</p>

        <div className="flex justify-center gap-1 mb-4">
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
                  star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={testimonial}
          onChange={e => setTestimonial(e.target.value.slice(0, 500))}
          placeholder="Share a testimonial about this worker (optional)"
          rows={4}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{testimonial.length}/500</p>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Maybe Latar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}