import { api } from "@/services/axios-instance/axios-instance";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState } from "react";
import ChangePasswordModal from "./change-password-modal";

interface UserProfileData {
  name: string;
  email: string;
  phone?: number;
  createdAt?: Date;
}

export default function ProfileSettings() {
  const [userProfileData, setUserProfileData] =
    useState<UserProfileData | null>(null);

  const userId = AuthHelper.getUserId();

  // get users details api
  useEffect(() => {
    console.log("haiiiii");
    const userDetails = async () => {
      try {
        const resp = await api.get(`/auth/get-user-profile-settings/${userId}`);

        if (resp.data.success) {
          setUserProfileData(resp.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    userDetails();
  }, [userId]);
  const joinedDate = userProfileData?.createdAt ? new Date(userProfileData.createdAt).toLocaleDateString() : null;

  // modal open
  const [isOpen, setIsOpen] = useState(false)


  return (
    <div>
      <h1>User Profile</h1>
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