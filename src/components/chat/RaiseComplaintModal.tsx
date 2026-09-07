import { useState } from 'react';
import axios from 'axios';
import { Loader2, X, ImagePlus, Video as VideoIcon } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DisputeService  } from '@/services/dispute-service';
import type { ComplaintType  } from '@/services/dispute-service';
import { getErrorMessage } from '@/utils/error-helper';

interface RaiseComplaintModalProps {
  open: boolean;
  onClose: () => void;
  workId: string;
  workerId: string;
  workerName: string;
  workTitle: string;
}

const COMPLAINT_TYPES: { value: ComplaintType; label: string }[] = [
  { value: 'against_worker', label: 'Against Worker' },
  { value: 'about_work', label: 'About Work' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'work_not_completed', label: 'Work Not Completed' },
  { value: 'fraud_suspicion', label: 'Fraud Suspicion' },
  { value: 'other', label: 'Other' },
];

export default function RaiseComplaintModal({
  open, onClose, workId, workerId, workerName, workTitle,
}: RaiseComplaintModalProps) {
  const [complaintType, setComplaintType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setComplaintType(null);
    setDescription('');
    setImages([]);
    setVideo(null);
    setError(null);
    onClose();
  };

  const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video') => {
    const sigRes = await DisputeService.getUploadSignature(resourceType);
    const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data.data;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const res = await axios.post(uploadUrl, formData);
    return res.data.secure_url as string;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (images.length >= 2) {
      setError('You can only upload up to 2 images.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setImages(prev => [...prev, url]);
    } catch {
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (video) {
      setError('You can only upload 1 video.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be under 50 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'video');
      setVideo(url);
    } catch {
      setError('Video upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!complaintType) {
      setError('Please select a complaint type.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await DisputeService.createDispute({
        workId,
        workerId,
        complaintType,
        description: description.trim(),
        proofImages: images,
        proofVideo: video || undefined,
      });
      resetAndClose();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raise a Complaint</DialogTitle>
          <DialogDescription>Regarding "{workTitle}" with {workerName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium">Complaint type</p>
          <div className="grid grid-cols-2 gap-2">
            {COMPLAINT_TYPES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setComplaintType(opt.value)}
                className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                  complaintType === opt.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Description</p>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 1000))}
            placeholder="Explain what happened…"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Evidence (optional)</p>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={img} className="relative w-16 h-16">
                <img src={img} alt="proof" className="w-16 h-16 rounded object-cover" />
                <button
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-background border rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {video && (
              <div className="relative w-16 h-16">
                <video src={video} className="w-16 h-16 rounded object-cover" />
                <button
                  onClick={() => setVideo(null)}
                  className="absolute -top-1.5 -right-1.5 bg-background border rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {images.length < 2 && (
              <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploading} />
              </label>
            )}
            {!video && (
              <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-5 h-5" />}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} disabled={uploading} />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Up to 2 images and 1 video</p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}