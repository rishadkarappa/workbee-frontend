import { useEffect, useRef, useState } from "react";
import ChangePasswordModal from "./models/change-password-modal";
import { toast } from "sonner";
import axios from "axios";
import {
  Camera,
  Mail,
  MapPin,
  Calendar,
  Pencil,
  ShieldCheck,
  LockKeyhole,
  Bell,
  UserRound,
  Settings2,
  Loader2,
  Check,
  X,
} from "lucide-react";

import type { UserProfileData } from "./types/types";
import { AuthService } from "@/services/auth-service";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TABS = [
  {
    value: "Personal",
    label: "Personal",
    icon: UserRound,
  },
  {
    value: "Account",
    label: "Account",
    icon: Settings2,
  },
  {
    value: "Security",
    label: "Security",
    icon: LockKeyhole,
  },
  {
    value: "Notifications",
    label: "Notifications",
    icon: Bell,
  },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function ProfileSettings() {
  const [userProfileData, setUserProfileData] =
    useState<UserProfileData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
  });

  // Get user profile

  useEffect(() => {
    const userDetails = async () => {
      try {
        const response = await AuthService.getUserProfileData();

        if (response.data.success) {
          const data = response.data.data;

          setUserProfileData(data);

          setEditData({
            name: data.name ?? "",
            phone: data.phone ?? "",
            location: data.location ?? "",
            bio: data.bio ?? "",
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      }
    };

    userDetails();
  }, []);

  // Start editing

  const handleEditProfile = () => {
    if (!userProfileData) return;

    setEditData({
      name: userProfileData.name ?? "",
      phone: userProfileData.phone ?? "",
      location: userProfileData.location ?? "",
      bio: userProfileData.bio ?? "",
    });

    setIsEditing(true);
  };

  // Cancel editing

  const handleCancelEdit = () => {
    if (!userProfileData) return;

    setEditData({
      name: userProfileData.name ?? "",
      phone: userProfileData.phone ?? "",
      location: userProfileData.location ?? "",
      bio: userProfileData.bio ?? "",
    });

    setIsEditing(false);
  };

  // Update profile

  const handleUpdateProfile = async () => {
    try {
      if (!editData.name.trim()) {
        toast.error("Name is required");
        return;
      }

      if (!editData.phone.trim()) {
        toast.error("Phone number is required");
        return;
      }

      setSaving(true);

      const response = await AuthService.updateUserProfile({
        name: editData.name.trim(),
        phone: editData.phone.trim(),
        location: editData.location.trim(),
        bio: editData.bio.trim(),
      });

      if (response.data.success) {
        const updatedData = response.data.data;

        setUserProfileData(updatedData);

        setEditData({
          name: updatedData.name ?? "",
          phone: updatedData.phone ?? "",
          location: updatedData.location ?? "",
          bio: updatedData.bio ?? "",
        });

        setIsEditing(false);

        toast.success(
          response.data.message || "Profile updated successfully"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Joined date

  const joinedDate = userProfileData?.createdAt
    ? new Date(userProfileData.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : "—";

  // Initials

  const initials = userProfileData?.name
    ? userProfileData.name
      .split(" ")
      .map((name) => name[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  // Profile image

  const handleAddProfileImage = () => {
    if (uploading) return;

    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.warning("Only JPG, PNG and WEBP images are allowed");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Image must be smaller than 5MB");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    try {
      setUploading(true);

      // Get signed Cloudinary upload data
      const signatureResponse = await AuthService.getUploadSign();

      const {
        signature,
        timestamp,
        apiKey,
        cloudeName,
        folder,
      } = signatureResponse.data.data;

      // Prepare Cloudinary upload
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudeName}/image/upload`;

      // Upload to Cloudinary
      const cloudinaryResponse = await axios.post(
        cloudinaryUrl,
        formData
      );

      const { secure_url, public_id } = cloudinaryResponse.data;

      // Save image URL in backend
      const saveResponse =
        await AuthService.saveImageUrlFromCloud({
          imageUrl: secure_url,
          publicId: public_id,
        });

      if (saveResponse.data.success) {
        setUserProfileData((prev) =>
          prev
            ? {
              ...prev,
              userProfileImage: secure_url,
            }
            : prev
        );

        toast.success("Profile image updated successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload profile image");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Render

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      {/* 
          PROFILE HEADER
       */}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-20">
            <div className="flex h-full items-center px-6 sm:px-8">
              <div className="flex w-full items-center gap-5">
                {/* Avatar */}
                <div className="relative h-16 w-16 shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted text-xl font-semibold text-muted-foreground shadow-sm">
                    {userProfileData?.userProfileImage ? (
                      <img
                        src={userProfileData.userProfileImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={handleAddProfileImage}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-background shadow-sm"
                  >
                    {uploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}

                    <span className="sr-only">
                      Change profile image
                    </span>
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Profile information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                      {userProfileData?.name ?? "User"}
                    </h1>

                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {userProfileData?.email ?? "—"}
                      </span>
                    </span>

                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {userProfileData?.location || "Not added"}
                    </span>

                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      Joined {joinedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 
          TABS
       */}

      <div className="rounded-xl border border-border bg-muted/40 p-1">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`
                  flex items-center justify-center gap-2
                  rounded-lg px-3 py-2.5
                  text-sm font-medium
                  transition-all
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-background
                  ${isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 
          PERSONAL
       */}

      {activeTab === "Personal" && (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">
                Personal Information
              </CardTitle>

              <CardDescription className="mt-1">
                Update your personal details and profile information.
              </CardDescription>
            </div>

            {/* Profile actions */}
            <div className="flex shrink-0 items-center gap-2">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={handleEditProfile}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Fields */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Name */}
              <ProfileField
                label="Name"
                value={
                  isEditing
                    ? editData.name
                    : userProfileData?.name ?? ""
                }
                disabled={!isEditing}
                onChange={(value) =>
                  setEditData((prev) => ({
                    ...prev,
                    name: value,
                  }))
                }
              />

              {/* Email */}
              <ProfileField
                label="Email"
                value={userProfileData?.email ?? ""}
                disabled
              />

              {/* Phone */}
              <ProfileField
                label="Phone"
                value={
                  isEditing
                    ? editData.phone
                    : userProfileData?.phone ?? ""
                }
                disabled={!isEditing}
                onChange={(value) =>
                  setEditData((prev) => ({
                    ...prev,
                    phone: value,
                  }))
                }
              />

              {/* Location */}
              <ProfileField
                label="Location"
                value={
                  isEditing
                    ? editData.location
                    : userProfileData?.location || "Not added"
                }
                disabled={!isEditing}
                onChange={(value) =>
                  setEditData((prev) => ({
                    ...prev,
                    location: value,
                  }))
                }
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>

              <Textarea
                id="profile-bio"
                value={
                  isEditing
                    ? editData.bio
                    : userProfileData?.bio ?? ""
                }
                disabled={!isEditing}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                placeholder="Add a short bio..."
                maxLength={500}
                rows={4}
                className="resize-none"
              />

              {isEditing && (
                <div className="flex justify-end">
                  <p className="text-xs text-muted-foreground">
                    {editData.bio.length}/500
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 
          ACCOUNT
       */}

      {activeTab === "Account" && (
        <PlaceholderPanel
          title="Account"
          description="Manage your account preferences and settings."
          icon={Settings2}
        />
      )}

      {/* 
          SECURITY
       */}

      {activeTab === "Security" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LockKeyhole className="h-5 w-5" />
              Security
            </CardTitle>

            <CardDescription>
              Manage your account security and password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Password
                </h3>

                <p className="max-w-xl text-sm text-muted-foreground">
                  Keep your account secure by regularly updating
                  your password.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setIsOpen(true)}
                className="shrink-0"
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 
          NOTIFICATIONS
       */}

      {activeTab === "Notifications" && (
        <PlaceholderPanel
          title="Notifications"
          description="Manage how you receive notifications and updates."
          icon={Bell}
        />
      )}

      {/* Password modal */}
      <ChangePasswordModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </div>
  );
}

/* 
   PROFILE FIELD
 */

function ProfileField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const id = `profile-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

/* 
   PLACEHOLDER PANEL
 */

function PlaceholderPanel({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>

        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Coming soon
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              This section isn't wired up yet.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}