import { useEffect, useState } from 'react';
import { X, User } from 'lucide-react';
import { AuthService } from '@/services/auth-service';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfileData {
  name: string;
  userProfileImage?: string;
}

export default function UserProfileModal({ open, onClose, userId }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setError(null);
    AuthService.getUserProfileById(userId)
      .then(res => setProfile(res.data.data))
      .catch(() => setError('Failed to load user profile.'))
      .finally(() => setLoading(false));
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : error || !profile ? (
          <p className="text-sm text-red-500 text-center py-8">{error || 'User not found.'}</p>
        ) : (
          <div className="flex flex-col items-center text-center py-2">
            {profile.userProfileImage ? (
              <img src={profile.userProfileImage} alt={profile.name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mt-4">{profile.name}</h3>
          </div>
        )}
      </div>
    </div>
  );
}