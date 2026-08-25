// import { api } from "@/services/axios-instance/axios-instance"
// import { XIcon } from "lucide-react"
// import React, { useState } from "react"
// import { toast } from "sonner"

// interface ModalProps {
//     isOpen:boolean;
//     setIsOpen:React.Dispatch<React.SetStateAction<boolean>>
// }

// export default function ChangePasswordModal({ isOpen, setIsOpen }: ModalProps) {

//     const [currentPassword, setCurrentPassword] = useState("")
//     const [newPassword, setNewPassword] = useState("")
//     const [confirmNewPassword, setConfirmNewPassword] = useState("")



//     // change password api
//     const changePassowrd = async (e:React.SubmitEvent<HTMLFormElement>) => {
//         e.preventDefault()
//         try {

//             const resp = await api.post('/auth/change-user-password', {
//                 currentPassword,
//                 newPassword
//             })
//             if (resp.data.success) {
//                 console.log(resp.data.data)
//                 console.log(resp.data)
//                 toast.success("Password had been updated")
//                 setIsOpen(false)
//             } else {

//                 toast.warning("Somethings went wrong!")
//             }

//         } catch (error) {
//             toast.error("Cant able to change password")
//             console.log(error)
//         }
//     }

//     if (!isOpen) {
//         return null;
//     }

//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/50">
//             <div className="relative w-full max-w-md rounded-lg bg-white p-8">

//                 {/* close X button */}
//                 <button
//                     type="button"
//                     onClick={() => setIsOpen(false)}
//                     className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-black"
//                 >
//                     <XIcon size={20} />
//                 </button>

//                 {/* Heading */}
//                 <h2 className="mb-6 text-xl font-semibold">
//                     Change Password
//                 </h2>

//                 <form
//                     onSubmit={changePassowrd}
//                     className="flex flex-col gap-4"
//                 >
//                     {/* Current password */}
//                     <div className="flex flex-col gap-1">
//                         <label className="text-sm font-medium">
//                             Current Password
//                         </label>

//                         <input
//                             type="password"
//                             placeholder="Enter current password"
//                             value={currentPassword}
//                             onChange={(e) => setCurrentPassword(e.target.value)}
//                             className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
//                         />
//                     </div>

//                     {/* New password */}
//                     <div className="flex flex-col gap-1">
//                         <label className="text-sm font-medium">
//                             New Password
//                         </label>

//                         <input
//                             type="password"
//                             placeholder="Enter new password"
//                             value={newPassword}
//                             onChange={(e) => setNewPassword(e.target.value)}
//                             className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
//                         />
//                     </div>

//                     {/* Confirm password */}
//                     <div className="flex flex-col gap-1">
//                         <label className="text-sm font-medium">
//                             Confirm New Password
//                         </label>

//                         <input
//                             type="password"
//                             placeholder="Confirm new password"
//                             value={confirmNewPassword}
//                             onChange={(e) => setConfirmNewPassword(e.target.value)}
//                             className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
//                         />
//                     </div>

//                     {/* Submit */}
//                     <button
//                         type="submit"
//                         className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
//                     >
//                         Change Password
//                     </button>
//                 </form>

//             </div>
//         </div>
//     )
// }

import { api } from "@/services/axios-instance/axios-instance";
import { Eye, EyeOff, Loader2, XIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ChangePasswordModal({
  isOpen,
  setIsOpen,
}: ModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const changePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/change-user-password",
        {
          currentPassword,
          newPassword,
        }
      );

      if (response.data.success) {
        toast.success("Password has been updated");

        // Clear fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");

        // Close modal
        setIsOpen(false);
      } else {
        toast.warning("Something went wrong!");
      }
    } catch (error: unknown) {
      console.error(error);

      toast.error("Can't change password");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      setIsOpen(open);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-[390px]">


        {/* Form */}
        <form
          onSubmit={changePassword}
          className="space-y-5 pt-2"
        >

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">
              Current Password
            </Label>

            <div className="relative">
              <Input
                id="current-password"
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                disabled={loading}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrentPassword(
                    (prev) => !prev
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              New Password
            </Label>

            <div className="relative">
              <Input
                id="new-password"
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                disabled={loading}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    (prev) => !prev
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              Confirm New Password
            </Label>

            <div className="relative">
              <Input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) =>
                  setConfirmNewPassword(
                    e.target.value
                  )
                }
                disabled={loading}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {loading
                ? "Changing..."
                : "Change Password"}
            </Button>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}