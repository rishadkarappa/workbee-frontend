import { useEffect, useState } from "react";
import { User, Loader2, BadgeCheck } from "lucide-react";

import { AuthService } from "@/services/auth-service";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "../ui/badge";

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfileData {
  name: string;
  userProfileImage?: string;
}

export default function UserProfileModal({
  open,
  onClose,
  userId,
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    setError(null);
    setProfile(null);

    AuthService.getUserProfileById(userId)
      .then((res) => setProfile(res.data.data))
      .catch(() => setError("Failed to load user profile."))
      .finally(() => setLoading(false));
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>

          <DialogTitle>User Profile
            <Badge
              variant="secondary"
              className="gap-1 rounded-full px-2 py-0.5 text-xs"
            >
              <BadgeCheck className="size-3.5" />
              Verified User
            </Badge>
          </DialogTitle>

        </DialogHeader>

        <Separator />

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !profile ? (
          <div className="flex min-h-40 items-center justify-center">
            <p className="text-center text-sm text-destructive">
              {error || "User not found."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <Avatar className="size-24">
              <AvatarImage
                src={profile.userProfileImage}
                alt={profile.name}
              />

              <AvatarFallback className="text-2xl">
                {profile.name?.charAt(0).toUpperCase() || (
                  <User className="size-10" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="mt-4 flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {profile.name}
              </h3>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}