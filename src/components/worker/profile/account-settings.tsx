import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Camera, Mail, MapPin, Calendar, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { WorkService } from "@/services/work-service";
import ChangePasswordModal from "./modals/change-password-modal";
import type { WorkerProfileData } from "./types/types";

const TABS = ["Personal", "Work Info", "Security", "Notifications"] as const;
type Tab = (typeof TABS)[number];

export default function WorkerAccountSettings() {
  const [worker, setWorker] = useState<WorkerProfileData | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");

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

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
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

        <button
          type="button"
          className="h-fit rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Edit Profile
        </button>
      </div>

      {/* ---------- tabs ---------- */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---------- tab content ---------- */}
      {activeTab === "Personal" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Personal Information
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Your personal details on file.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Name" value={worker.name} disabled />
            <Field label="Email" value={worker.email} disabled />
            <Field label="Phone" value={String(worker.phone ?? "—")} disabled />
            <Field label="Location" value={worker.location} disabled />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Change Password
            </h3>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Change Password
            </button>
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

      {activeTab === "Security" && <PlaceholderPanel title="Security" />}
      {activeTab === "Notifications" && (
        <PlaceholderPanel title="Notifications" />
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
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
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