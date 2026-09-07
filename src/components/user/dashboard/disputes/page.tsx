import { useEffect, useState } from 'react';
import { DisputeService } from '@/services/dispute-service';
import { Loader2 } from 'lucide-react';

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
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DisputeService.getMyDisputes()
      .then(res => setDisputes(res.data.data || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">My Disputes</h1>

      {disputes.length === 0 ? (
        <p className="text-gray-500 text-sm">You haven't raised any complaints yet.</p>
      ) : (
        disputes.map(d => (
          <div key={d.id} className="border rounded-lg p-4 bg-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{d.workTitle}</p>
                <p className="text-xs text-gray-500">{COMPLAINT_LABELS[d.complaintType] || d.complaintType}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[d.status]}`}>
                {d.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-sm text-gray-700">{d.description}</p>

            {(d.proofImages.length > 0 || d.proofVideo) && (
              <div className="flex gap-2 flex-wrap">
                {d.proofImages.map(img => (
                  <img key={img} src={img} alt="proof" className="w-16 h-16 rounded object-cover" />
                ))}
                {d.proofVideo && <video src={d.proofVideo} className="w-16 h-16 rounded object-cover" controls />}
              </div>
            )}

            {d.actions.length > 0 && (
              <div className="border-t pt-2 mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-500">Resolution</p>
                {d.actions.map((a, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    {a.actionType.replace(/_/g, ' ')} — {a.reason}
                  </p>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400">Filed on {new Date(d.createdAt).toLocaleDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
}