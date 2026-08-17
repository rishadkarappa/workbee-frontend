import { api } from "@/services/axios-instance/axios-instance"
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState } from "react"

interface UserProfileData {
  name: string;
  email: string;
  phone?: number;

}

export default function ProfileSettings() {
  // user profile settings
  const [userProfileData, setUserProfileData] = useState<UserProfileData|null>(null)
  const userId = AuthHelper.getUserId()
  useEffect(() => {
    const UserDetails = async () => {
      try {
        let resp = await api.get(`/auth/get-user-profile-settings${userId}`)
        if (resp.data.success) {
          setUserProfileData(resp.data)
        }
      } catch (error) {
        console.log(error)
      }
    }
    UserDetails()
  }, [])

  return (
    <div>
      <h1>User Profile</h1>
      <h2>{userProfileData?.name}</h2>
      <h2>{userProfileData?.email}</h2>
      <h2>{userProfileData?.phone}</h2>
    </div>
  )
}
