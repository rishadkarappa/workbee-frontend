import { useEffect, useRef, useState } from "react";

import axios from "axios";
import {
  Camera,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Pencil,
  LockKeyhole,
  UserRound,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { WorkService } from "@/services/work-service";
import ChangePasswordModal from "./modals/change-password-modal";
import type { WorkerProfileData } from "./types/types";

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
    value: "Work Info",
    label: "Work Info",
    icon: Briefcase,
  },
  {
    value: "Security",
    label: "Security",
    icon: LockKeyhole,
  },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function WorkerAccountSettings() {
  const [worker, setWorker] = useState<WorkerProfileData | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
  });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get worker profile

  useEffect(() => {
    const getWorkerProfile = async () => {
      try {
        const response = await WorkService.getWorkerProfile();

        if (response.data.success) {
          setWorker(response.data.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load worker profile");
      }
    };

    getWorkerProfile();
  }, []);

  // Focus name when editing

  useEffect(() => {
    if (isEditing) {
      nameInputRef.current?.focus();
    }
  }, [isEditing]);

  // Profile image

  const handleProfileImageClick = () => {
    if (uploading) return;

    fileInputRef.current?.click();
  };

  // Start editing

  const handleEditProfile = () => {
    if (!worker) return;

    setEditForm({
      name: worker.name ?? "",
      phone: String(worker.phone ?? ""),
      location: worker.location ?? "",
      bio: worker.bio ?? "",
    });

    setIsEditing(true);
  };

  // Cancel editing

  const handleCancelEdit = () => {
    if (!worker) return;

    setEditForm({
      name: worker.name ?? "",
      phone: String(worker.phone ?? ""),
      location: worker.location ?? "",
      bio: worker.bio ?? "",
    });

    setIsEditing(false);
  };

  // Edit change

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update profile

  const handleUpdateProfile = async () => {
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      nameInputRef.current?.focus();
      return;
    }

    if (editForm.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      nameInputRef.current?.focus();
      return;
    }

    if (!editForm.phone.trim()) {
      toast.error("Phone number is required");
      phoneInputRef.current?.focus();
      return;
    }

    if (!/^[6-9]\d{9}$/.test(editForm.phone)) {
      toast.error("Enter a valid 10-digit phone number");
      phoneInputRef.current?.focus();
      return;
    }

    if (!editForm.location.trim()) {
      toast.error("Location is required");
      locationInputRef.current?.focus();
      return;
    }

    if (editForm.bio.length > 500) {
      toast.error("Bio must be less than 500 characters");
      bioInputRef.current?.focus();
      return;
    }

    try {
      setIsUpdating(true);

      const response = await WorkService.updateWorkerProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        location: editForm.location.trim(),
        bio: editForm.bio.trim(),
      });

      if (response.data.success) {
        setWorker((prev) =>
          prev
            ? {
              ...prev,
              name: editForm.name.trim(),
              phone: editForm.phone.trim(),
              location: editForm.location.trim(),
              bio: editForm.bio.trim(),
            }
            : prev
        );

        setIsEditing(false);

        toast.success(
          response.data.message || "Profile updated successfully"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Profile image upload

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

      // 1. Get signed Cloudinary upload data
      const signatureResponse =
        await WorkService.getUploadSign();

      const {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      } = signatureResponse.data.data;

      // 2. Upload directly to Cloudinary
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const cloudinaryResponse = await axios.post(
        cloudinaryUrl,
        formData
      );

      const { secure_url, public_id } =
        cloudinaryResponse.data;

      // 3. Save Cloudinary information
      const saveResponse =
        await WorkService.saveImageUrlFromCloud({
          imageUrl: secure_url,
          publicId: public_id,
        });

      if (saveResponse.data.success) {
        setWorker((prev) =>
          prev
            ? {
              ...prev,
              workerProfileImage: secure_url,
              workerProfileImagePublicId: public_id,
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

  // Loading

  if (!worker) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4">
        <Card>
          <CardContent className="flex min-h-32 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading worker profile...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derived values

  const initials = worker.name
    ?.split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const joinedDate = worker.createdAt
    ? new Date(worker.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : "—";

  // Render

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-8">
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
                    {worker.workerProfileImage ? (
                      <img
                        src={worker.workerProfileImage}
                        alt="Worker profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  {/* Camera */}
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={handleProfileImageClick}
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
                      {worker.name}
                    </h1>

                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Worker
                    </span>
                  </div>

                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {worker.workType}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {worker.email ?? "—"}
                      </span>
                    </span>

                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {worker.location ?? "—"}
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
        <div className="grid grid-cols-3 gap-1">
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
                Your personal details on file.
              </CardDescription>
            </div>

            {/* Actions */}
            {!isEditing ? (
              <Button
                type="button"
                onClick={handleEditProfile}
                className="shrink-0 gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Personal fields */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <WorkerField
                label="Name"
                value={
                  isEditing ? editForm.name : worker.name
                }
                name="name"
                disabled={!isEditing}
                onChange={handleEditChange}
                inputRef={nameInputRef}
              />

              <WorkerField
                label="Email"
                value={worker.email}
                disabled
              />

              <WorkerField
                label="Phone"
                value={
                  isEditing
                    ? editForm.phone
                    : String(worker.phone ?? "—")
                }
                name="phone"
                disabled={!isEditing}
                onChange={handleEditChange}
                inputRef={phoneInputRef}
              />

              <WorkerField
                label="Location"
                value={
                  isEditing
                    ? editForm.location
                    : worker.location ?? "—"
                }
                name="location"
                disabled={!isEditing}
                onChange={handleEditChange}
                inputRef={locationInputRef}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="worker-bio">Bio</Label>

              <Textarea
                id="worker-bio"
                ref={bioInputRef}
                name="bio"
                value={
                  isEditing
                    ? editForm.bio
                    : worker.bio ?? ""
                }
                onChange={handleEditChange}
                disabled={!isEditing}
                rows={4}
                maxLength={500}
                placeholder="Tell clients a little about yourself..."
                className="resize-none"
              />

              {isEditing && (
                <div className="flex justify-end">
                  <p className="text-xs text-muted-foreground">
                    {editForm.bio.length}/500
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 
          WORK INFO
       */}

      {activeTab === "Work Info" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5" />
              Work Details
            </CardTitle>

            <CardDescription>
              The type of work and preferences tied to your
              worker profile.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <WorkerField
                label="Work Type"
                value={worker.workType}
                disabled
              />

              <WorkerField
                label="Preferred Works"
                value={
                  worker.preferredWorks?.join(", ") || "—"
                }
                disabled
              />
            </div>
          </CardContent>
        </Card>
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
                  Keep your account secure by regularly
                  updating your password.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="shrink-0"
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        setIsOpen={setIsPasswordModalOpen}
      />
    </div>
  );
}

/* 
   WORKER FIELD
 */

function WorkerField({
  label,
  value,
  name,
  onChange,
  disabled,
  inputRef,
}: {
  label: string;
  value: string;
  name?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const id = `worker-${label
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Input
        ref={inputRef}
        id={id}
        type="text"
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
