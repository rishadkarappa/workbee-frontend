// components/chat/MediaMessage.tsx
import { useState } from 'react';
import { Play, Image as ImageIcon, Loader2 } from 'lucide-react';

interface MediaMessageProps {
  type: 'image' | 'video';
  mediaUrl: string;
  isSent: boolean;
}

export function MediaMessage({ type, mediaUrl, isSent }: MediaMessageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (type === 'image') {
    return (
      <div className="relative max-w-xs rounded-lg overflow-hidden">
        {!loaded && !error && (
          <div className={`w-48 h-32 flex items-center justify-center rounded-lg ${isSent ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        {error && (
          <div className={`w-48 h-32 flex flex-col items-center justify-center gap-1 rounded-lg ${isSent ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <ImageIcon className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Failed to load</span>
          </div>
        )}
        <img
          src={mediaUrl}
          alt="Shared image"
          className={`max-w-xs rounded-lg object-cover cursor-pointer transition-opacity ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
          style={{ maxHeight: '300px' }}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(false); }}
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      </div>
    );
  }

  // Video
  return (
    <div className="relative max-w-xs rounded-lg overflow-hidden">
      <video
        src={mediaUrl}
        controls
        className="max-w-xs rounded-lg"
        style={{ maxHeight: '300px', maxWidth: '280px' }}
        preload="metadata"
        onError={() => setError(true)}
      >
        <track kind="captions" />
        Your browser does not support video.
      </video>
      {error && (
        <div className={`w-48 h-32 flex flex-col items-center justify-center gap-1 rounded-lg ${isSent ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Play className="w-6 h-6 text-gray-400" />
          <span className="text-xs text-gray-400">Failed to load video</span>
        </div>
      )}
    </div>
  );
}