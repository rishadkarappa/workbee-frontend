import { api } from "@/services/axios-instance/axios-instance"
import { AuthHelper } from "@/utils/auth-helper"
import { XIcon } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"

export default function ChangePasswordModal({ isOpen, setIsOpen }: any) {

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")



    // change password api
    const userId = AuthHelper.getUserId()
    const changePassowrd = async (e:React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {

            let resp = await api.post('/auth/change-user-password', {
                currentPassword,
                newPassword
            })
            if (resp.data.success) {
                toast.success("Password had been updated")
                setIsOpen(false)
            } else {

                toast.warning("Somethings went wrong!")
            }

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
            <div className="relative w-full max-w-md rounded-lg bg-white p-8">

                {/* close X button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-black"
                >
                    <XIcon size={20} />
                </button>

                {/* Heading */}
                <h2 className="mb-6 text-xl font-semibold">
                    Change Password
                </h2>

                <form
                    onSubmit={changePassowrd}
                    className="flex flex-col gap-4"
                >
                    {/* Current password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">
                            Current Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
                        />
                    </div>

                    {/* New password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">
                            New Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
                        />
                    </div>

                    {/* Confirm password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">
                            Confirm New Password
                        </label>

                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Change Password
                    </button>
                </form>

            </div>
        </div>
    )
}
