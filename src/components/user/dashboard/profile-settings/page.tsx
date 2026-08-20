import { api } from "@/services/axios-instance/axios-instance";
import { useEffect, useRef, useState } from "react";
import ChangePasswordModal from "./change-password-modal";
import { toast } from "sonner";
import axios from "axios";

interface UserProfileData {
  name: string;
  email: string;
  phone?: number;
  createdAt?: Date;
  userProfileImage?: string;
}

export default function ProfileSettings() {
  // user profile data states
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);

  //file input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // uploading state
  const [uploading, setUploading] = useState(false);


  // get users details api
  useEffect(() => {
    // console.log("haiiiii");
    const userDetails = async () => {
      try {
        const resp = await api.get('/auth/get-user-profile-settings');

        if (resp.data.success) {
          setUserProfileData(resp.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    userDetails();
  }, []);
  // Joined Date change readable formalt
  const joinedDate = userProfileData?.createdAt ? new Date(userProfileData.createdAt).toLocaleDateString() : null;

  // modal open
  const [isOpen, setIsOpen] = useState(false)

  // ------------------------------------------------


  /**
   * add profile functionality
   */

  // Open file selector
  const handleAddProfileImage = () => {
    fileInputRef.current?.click();
  };

  const AddProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;

    // valdate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Only JPG, PNG and WEBP images are allowed")
    }

    // validate file size
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Image must be smaller than 5MB ")
      return
    }

    try {
      setUploading(true)

      //1 - get Cloudinary signature
      const signatureResponse = await api.get("/auth/profile-image/upload-signature")
      const { signature, timestamp, apiKey, cloudeName, folder } = signatureResponse.data.data

      //2 - upload directly to cloudinary
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudeName}/image/upload`
      const cloudinaryReponse = await axios.post(cloudinaryUrl, formData)
      const { secureUrl, public_id } = cloudinaryReponse.data

      //3 - save img URL in auth service
      const saveResponse = await api.patch("/auth/profile-image", {
        imageUrl: secureUrl,
        public_id: public_id
      })

      if (saveResponse.data.success) {
        setUserProfileData(prev =>
          prev ? { ...prev, userProfileImage: secureUrl } : prev
        )
        toast.success("Profile image updated successfully");
      }

    } catch (error) {
      console.log(error)
      toast.error("Failed to upload profile image.");
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }



  return (
    <div>
      <h1>User Profile</h1>


      {/* add profile image div */}
      <div className="rounded-full bg-gray-300 h-18 w-18 flex items-center justify-center">
        {userProfileData?.userProfileImage ? (
          <img
            src={userProfileData.userProfileImage}
            alt="Profile"
            className="w-full h-full rounded object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={handleAddProfileImage}
            className="h-full w-full text-xs text-gray-700"
          >
            Add profile
          </button>
        )}
      </div>

      {/* uploading overlay */}
      {uploading && (
        <div className="absalute inset-0 flex intems-center justify-center rounded-full bg-black/50 text-xs test-white">
          Uploading...
        </div>
      )}


      <h2>{userProfileData?.name}</h2>
      <h2>{userProfileData?.email}</h2>
      <h2>{joinedDate}</h2>
      <h2>{userProfileData?.phone}</h2>

      <div>

        <h1>change password - </h1>
        <button onClick={() => setIsOpen(true)} className="bg-gray-900 rounded p-2 text-sm text-white">Change Password</button>
      </div>

      <ChangePasswordModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

    </div>

  );
}