import { useEffect, useState } from 'react';
import { X, Star, User, CheckCircle2 } from 'lucide-react';
import { WorkService } from '@/services/work-service';
import { ReviewService } from '@/services/review-service';

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : error || !stats ? (
          <p className="text-sm text-red-500 text-center py-8">{error || 'Worker not found.'}</p>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-4">
              {stats.workerProfileImage ? (
                <img src={stats.workerProfileImage} alt={stats.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 mt-3">{stats.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-800">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'No ratings yet'}
                </span>
                {stats.totalReviews > 0 && (
                  <span className="text-xs text-gray-400">({stats.totalReviews} reviews)</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-3 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{stats.totalWorksCompleted}</span> works completed
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Testimonials</p>
              {stats.testimonials.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No testimonials yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.testimonials.map((t, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-700">{t.testimonial}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}