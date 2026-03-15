// components/chat/MediaUploadButton.tsx
import { useRef, useState } from 'react';
import { Paperclip, X, Loader2 } from 'lucide-react';
import { ChatService } from '@/services/chat-service';

export interface UploadedMedia {
  url:          string;
  publicId:     string;
  resourceType: 'image' | 'video';
}

interface MediaUploadButtonProps {
  onUploaded: (media: UploadedMedia) => void;
  disabled?:  boolean;
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
];

export function MediaUploadButton({ onUploaded, disabled }: MediaUploadButtonProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only images (jpg, png, gif, webp) and videos (mp4, webm, mov, avi) are allowed.');
      return;
    }

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(file.type.startsWith('video/') ? 'Video must be under 50 MB.' : 'Image must be under 10 MB.');
      return;
    }

    try {
      setProgress(0);
      const response = await ChatService.uploadChatMedia(file, (pct) => setProgress(pct));
      const data = response.data.data;

      onUploaded({
        url:          data.url,
        publicId:     data.publicId,
        resourceType: data.resourceType,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setProgress(null);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || progress !== null}
      />

      {progress !== null ? (
        // Upload in progress
        <div className="flex items-center gap-1 px-2">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Attach image or video"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      )}

      {error && (
        <div className="absolute bottom-full left-0 mb-2 flex items-start gap-1 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 shadow-sm w-64 z-10">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="flex-shrink-0 ml-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}