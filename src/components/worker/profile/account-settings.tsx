import { useEffect, useRef, useState } from "react";

import axios from "axios";
import { Camera, Mail, MapPin, Calendar, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { WorkService } from "@/services/work-service";
import ChangePasswordModal from "./modals/change-password-modal";
import type { WorkerProfileData } from "./types/types";

const TABS = ["Personal", "Work Info", "Security"] as const;
type Tab = (typeof TABS)[number];

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

  useEffect(() => {
    if (isEditing) {
      nameInputRef.current?.focus();
    }
  }, [isEditing]);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

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

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


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

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.warning("Only JPG, PNG and WEBP images are allowed");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setUploading(true);

      // 1. Get signed Cloudinary upload data from Work Service
      const signatureResponse = await WorkService.getUploadSign();

      const { signature, timestamp, apiKey, cloudName, folder } =
        signatureResponse.data.data;

      // 2. Upload directly to Cloudinary
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const cloudinaryResponse = await axios.post(cloudinaryUrl, formData);

      const { secure_url, public_id } = cloudinaryResponse.data;

      // 3. Save Cloudinary information in Worker DB
      const saveResponse = await WorkService.saveImageUrlFromCloud({
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

  if (!worker) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading worker profile...
        </div>
      </div>
    );
  }

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

  return (
    <div className="mx-auto w-full space-y-6 p-4">
      {/* ---------- header card ---------- */}
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          {/* avatar */}
          <div className="relative h-20 w-20 flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl font-medium text-gray-500">
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

            <button
              type="button"
              onClick={handleProfileImageClick}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
            >
              <Camera className="h-3.5 w-3.5 text-gray-600" />
            </button>

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[10px] text-white">
                Uploading...
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* name + meta */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {worker.name}
              </h1>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Worker
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{worker.workType}</p>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {worker.email ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {worker.location ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- tabs ---------- */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${activeTab === tab
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-700"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---------- tab content ---------- */}
      {activeTab === "Personal" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {/* Section Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your personal details on file.
              </p>
            </div>

            {/* Edit / Update Actions */}
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEditProfile}
                className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Update Profile"}
                </button>
              </div>
            )}
          </div>

          {/* Personal Fields */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Name"
              value={isEditing ? editForm.name : worker.name}
              name="name"
              disabled={!isEditing}
              onChange={handleEditChange}
              inputRef={nameInputRef}
              isEditing={isEditing}
            />

            <Field
              label="Email"
              value={worker.email}
              disabled
            />

            <Field
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
              isEditing={isEditing}
            />

            <Field
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
              isEditing={isEditing}
            />
          </div>

          {/* Bio */}
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Bio
            </label>

            <textarea
              ref={bioInputRef}
              name="bio"
              value={isEditing ? editForm.bio : worker.bio ?? ""}
              onChange={handleEditChange}
              disabled={!isEditing}
              rows={4}
              maxLength={500}
              className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-gray-800 outline-none
          ${isEditing
                  ? "border-gray-400 ring-2 ring-gray-200"
                  : "border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                }`}
            />

            {isEditing && (
              <p className="mt-1 text-right text-xs text-gray-400">
                {editForm.bio.length}/500
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "Work Info" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Work Details</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            The type of work and preferences tied to your worker profile.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Work Type" value={worker.workType} disabled />
            <Field
              label="Preferred Works"
              value={worker.preferredWorks?.join(", ") || "—"}
              disabled
            />
          </div>
        </div>
      )}

      {activeTab === "Security" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Security
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your account security and password.
          </p>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Password
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Keep your account secure by regularly updating your password.
              </p>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        setIsOpen={setIsPasswordModalOpen}
      />
    </div>
  );
}

function Field({
  label,
  value,
  name,
  onChange,
  disabled,
  inputRef,
  isEditing,
}: {
  label: string;
  value: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isEditing?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-800 outline-none
          ${isEditing
            ? "border-gray-400 ring-2 ring-gray-200"
            : "border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
          }`}
      />
    </div>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">
        This section isn't wired up yet — coming soon.
      </p>
    </div>
  );
}