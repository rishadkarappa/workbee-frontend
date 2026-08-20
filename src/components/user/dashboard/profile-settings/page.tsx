import { api } from "@/services/axios-instance/axios-instance";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState } from "react";
import ChangePasswordModal from "./change-password-modal";

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

  // get users details api
  useEffect(() => {
    console.log("haiiiii");
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

  const AddProfileImage = () => {
    try {

    } catch (error) {
      console.log(error)
    }
  }



  return (
    <div>
      <h1>User Profile</h1>


      {/* add profile image div */}
      <div className="rounded-full bg-gray-300 h-18 w-18 flex items-center justify-center">
        {userProfileData?.userProfileImage ? (
          <img src={userProfileData.userProfileImage} alt="Set Profile Image" className="w-full h-full rounded object-cover" />
        ) : (
          <button onClick={AddProfileImage} type="button" className="text-xs text-gray-700">Add profile Image</button>
        )}
      </div>



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