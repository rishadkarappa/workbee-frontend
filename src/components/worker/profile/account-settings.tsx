import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { WorkService } from "@/services/work-service";
import { AuthService } from "@/services/auth-service";
// import ChangePasswordModal from "./modals/change-password-modal";

interface WorkerProfileData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  workType: string;
  preferredWorks: string[];
  profileImage?: string;
  profileImagePublicId?: string;
  createdAt: string;
}

export default function WorkerAccountSettings() {
  const [worker, setWorker] = useState<WorkerProfileData | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

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

      const cloudinaryUrl =
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const cloudinaryResponse = await axios.post(
        cloudinaryUrl,
        formData
      );

      const {
        secure_url,
        public_id,
      } = cloudinaryResponse.data;

      // 3. Save Cloudinary information in Worker DB
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
                profileImage: secure_url,
                profileImagePublicId: public_id,
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
      <div className="p-6">
        Loading worker profile...
      </div>
    );
  }

  const initials = worker.name
    ?.split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-3xl space-y-6 p-6">

      {/* Profile */}
      <div className="rounded-xl border bg-white p-6">

        <h1 className="text-xl font-semibold">
          Worker Account Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your worker profile and account.
        </p>

        {/* Profile image */}
        <div className="mt-6 flex items-center gap-4">

          <div className="relative h-20 w-20">

            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl font-semibold">

              {worker.profileImage ? (
                <img
                  src={worker.profileImage}
                  alt="Worker profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}

            </div>

            <button
              type="button"
              onClick={handleProfileImageClick}
              className="absolute bottom-0 right-0 rounded-full border bg-white p-2 shadow"
              disabled={uploading}
            >
              <Camera size={15} />
            </button>

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs text-white">
                Uploading
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

          <div>
            <h2 className="font-semibold">
              {worker.name}
            </h2>

            <p className="text-sm text-gray-500">
              {worker.workType}
            </p>
          </div>
        </div>

        {/* Worker information */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <ProfileField
            label="Name"
            value={worker.name}
          />

          <ProfileField
            label="Email"
            value={worker.email}
          />

          <ProfileField
            label="Phone"
            value={String(worker.phone)}
          />

          <ProfileField
            label="Location"
            value={worker.location}
          />

          <ProfileField
            label="Work Type"
            value={worker.workType}
          />

          <ProfileField
            label="Preferred Works"
            value={worker.preferredWorks?.join(", ") || "—"}
          />

        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border bg-white p-6">

        <h2 className="text-lg font-semibold">
          Security
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage your account password.
        </p>

        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Change Password
        </button>

      </div>

      {/* <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        setIsOpen={setIsPasswordModalOpen}
      /> */}

    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        value={value}
        disabled
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
      />
    </div>
  );
}