import { useEffect, useRef, useState } from "react";
import ChangePasswordModal from "./models/change-password-modal";
import { toast } from "sonner";
import axios from "axios";
import { Camera, Mail, MapPin, Calendar } from "lucide-react";
import type { UserProfileData } from "./types/types";
import { AuthService } from "@/services/auth-service";

const TABS = ["Personal", "Account", "Security", "Notifications"] as const;
type Tab = (typeof TABS)[number];

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

      // 1. Get signed Cloudinary upload data
      const signatureResponse = await AuthService.getUploadSign();

      const {
        signature,
        timestamp,
        apiKey,
        cloudeName,
        folder,
      } = signatureResponse.data.data;

      // 2. Prepare Cloudinary upload
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudeName}/image/upload`;

      // 3. Upload to Cloudinary
      const cloudinaryResponse = await axios.post(
        cloudinaryUrl,
        formData
      );

      const {
        secure_url,
        public_id,
      } = cloudinaryResponse.data;

      // 4. Save image URL in backend
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

  return (
    <div className="mx-auto w-full space-y-6">

      {/* 
          HEADER CARD
       */}
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-5">

          {/* Avatar */}
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

            {/* Camera button */}
            <button
              type="button"
              onClick={handleAddProfileImage}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5 text-gray-600" />
            </button>

            {/* Upload overlay */}
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

          {/* Name + Meta */}
          <div>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {userProfileData?.name ?? "User"}
              </h1>

              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Pro Member
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">

              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {userProfileData?.email ?? "—"}
              </span>

              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {userProfileData?.location || "Not added"}
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {joinedDate}
              </span>

            </div>
          </div>
        </div>

        {/* 
            RIGHT SIDE ACTIONS

            NORMAL:
            [ Edit Profile ]

            EDITING:
            [ Cancel ] [ Save Changes ]
         */}
        <div className="flex items-center justify-end gap-3">

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditProfile}
              className="h-fit rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="h-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={saving}
                className="h-fit rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

        </div>
      </div>

      {/* 
          TABS
       */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">

        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
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

      {/* 
          PERSONAL TAB
       */}
      {activeTab === "Personal" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="text-lg font-bold text-gray-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update your personal details and profile information.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* Name */}
            <Field
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
            <Field
              label="Email"
              value={userProfileData?.email ?? ""}
              disabled
            />

            {/* Phone */}
            <Field
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
            <Field
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
          <div className="mt-5">

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Bio
            </label>

            <textarea
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
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
            />

            {isEditing && (
              <p className="mt-1 text-right text-xs text-gray-400">
                {editData.bio.length}/500
              </p>
            )}

          </div>

        </div>
      )}

      {/* 
          ACCOUNT TAB
       */}
      {activeTab === "Account" && (
        <PlaceholderPanel title="Account" />
      )}

      {/* 
          SECURITY TAB
       */}
      {activeTab === "Security" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="text-lg font-bold text-gray-900">
            Security
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your account security and password.
          </p>

          <div className="mt-6 border-t border-gray-100 pt-6">

            <h3 className="text-sm font-semibold text-gray-900">
              Password
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Keep your account secure by regularly updating your password.
            </p>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Change Password
            </button>

          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <PlaceholderPanel title="Notifications" />
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
   FIELD COMPONENT
 */

function Field({
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

/* 
   PLACEHOLDER COMPONENT
 */

function PlaceholderPanel({
  title,
}: {
  title: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <h2 className="text-lg font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        This section isn't wired up yet — coming soon.
      </p>

    </div>
  );
}
