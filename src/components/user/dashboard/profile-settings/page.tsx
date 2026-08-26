import { useEffect, useRef, useState } from "react";
import ChangePasswordModal from "./models/change-password-modal";
import { toast } from "sonner";
import axios from "axios";
import { Camera, Mail, MapPin, Calendar } from "lucide-react";
import type { ExtraProfileData, UserProfileData } from "./types/types";
import { AuthService } from "@/services/auth-service";

const TABS = ["Personal", "Account", "Security", "Notifications"] as const;
type Tab = (typeof TABS)[number];

export default function ProfileSettings() {
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");

  //  dummy data until these fields have real backing endpoints ----
  const [extra, setExtra] = useState<ExtraProfileData>({
    firstName: "John",
    lastName: "Doe",
    jobTitle: "Senior Product Designer",
    company: "Acme Inc.",
    bio: "Passionate product designer with 8+ years of experience creating user-centered digital experiences. I love solving complex problems and turning ideas into beautiful, functional products.",
    location: "San Francisco, CA",
    badge: "Pro Member",
  });

  // get user profile data api
  useEffect(() => {
    const userDetails = async () => {
      try {
        const resp = await AuthService.getUserProfileData()
        if (resp.data.success) {
          setUserProfileData(resp.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    userDetails();
  }, []);

  const joinedDate = userProfileData?.createdAt
    ? new Date(userProfileData.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : "—";

  const initials = userProfileData?.name
    ? userProfileData.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  const handleAddProfileImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const signatureResponse = await AuthService.getUploadSign();
      const { signature, timestamp, apiKey, cloudeName, folder } = signatureResponse.data.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudeName}/image/upload`;
      const cloudinaryReponse = await axios.post(cloudinaryUrl, formData);
      const { secure_url, public_id } = cloudinaryReponse.data;

      const saveResponse = await AuthService.saveImageUrlFromCloud({
        imageUrl: secure_url,
        publicId: public_id,
      });

      if (saveResponse.data.success) {
        setUserProfileData((prev) => (prev ? { ...prev, userProfileImage: secure_url } : prev));
        toast.success("Profile image updated successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to upload profile image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="mx-auto w-full space-y-6 p-4">
      {/* ---------- header card ---------- */}
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          {/* avatar */}
          <div className="relative h-20 w-20 flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl font-medium text-gray-500">
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

            <button
              type="button"
              onClick={handleAddProfileImage}
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
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* name + meta */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {userProfileData?.name ?? `${extra.firstName} ${extra.lastName}`}
              </h1>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {extra.badge}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{extra.jobTitle}</p>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {userProfileData?.email ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {extra.location}
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
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${activeTab === tab
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
          <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your personal details and profile information.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="First Name"
              value={extra.firstName}
              onChange={(v) => setExtra((p) => ({ ...p, firstName: v }))}
            />
            <Field
              label="Last Name"
              value={extra.lastName}
              onChange={(v) => setExtra((p) => ({ ...p, lastName: v }))}
            />
            <Field label="Email" value={userProfileData?.email ?? ""} disabled />
            <Field
              label="Phone"
              value={userProfileData?.phone ? String(userProfileData.phone) : "+1 (555) 123-4567"}
              disabled
            />
            <Field
              label="Job Title"
              value={extra.jobTitle}
              onChange={(v) => setExtra((p) => ({ ...p, jobTitle: v }))}
            />
            <Field
              label="Company"
              value={extra.company}
              onChange={(v) => setExtra((p) => ({ ...p, company: v }))}
            />
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={extra.bio}
              onChange={(e) => setExtra((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400"
            />
          </div>

          <div className="mt-5">
            <Field
              label="Location"
              value={extra.location}
              onChange={(v) => setExtra((p) => ({ ...p, location: v }))}
            />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
            <button
              onClick={() => setIsOpen(true)}
              className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Change Password
            </button>
          </div>
        </div>
      )}

      {activeTab === "Account" && <PlaceholderPanel title="Account" />}
      {activeTab === "Security" && <PlaceholderPanel title="Security" />}
      {activeTab === "Notifications" && <PlaceholderPanel title="Notifications" />}

      <ChangePasswordModal isOpen={isOpen} setIsOpen={setIsOpen} />
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
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
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
      <p className="mt-1 text-sm text-gray-500">This section isn't wired up yet — coming soon.</p>
    </div>
  );
}