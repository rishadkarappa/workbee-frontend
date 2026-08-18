import { api } from "@/services/axios-instance/axios-instance"
import { AuthHelper } from "@/utils/auth-helper"
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ChangePasswordModal({isOpen, setIsOpen}:any) {

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setnewPassword] = useState("")
    const [confirmNewPassword, setconfirmNewPassword] = useState("")

   

    // change password api
    const userId = AuthHelper.getUserId()
    const changePassowrd = async () => {
        try {
            setIsOpen(false)
        } catch (error: any) {
            toast.error("Cant able to change password", error)
            console.log(error)
        }
    }

if (!isOpen) {
  return null;
}

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="relative bg-white rounded-lg p-9">
                <form className="flex flex-col gap-1" onSubmit={changePassowrd} action="submit">
                {/* current pass */}
                <input
                    type="text"
                    placeholder="current password"
                    value={currentPassword}
                    className="w-full rounded-lg p-3 border outline-none border-gray-300 border:right"

                />
                {/* new password */}
                <input
                    type="text"
                    placeholder="new password"
                    value={newPassword}
                />
                {/* confirm new password */}
                <input
                    type="text"
                    placeholder="confirm password"
                    value={confirmNewPassword}
                />
                <button type="button" className="mt-1 ml-1" onClick={() => setIsOpen(false)}>close</button>

                <button type="submit">Submit</button>
            </form>
            </div>
        </div>
    )
}
