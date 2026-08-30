import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/auth-service";
import ProfileDropDownMenu from "./profile-drop-down";
import NotificationDropdown from "./NotificationDropdown";
import { AuthHelper } from "@/utils/auth-helper";
import { notificationSocketService } from "@/services/notification-socket-service";
import { UserRole, type IUser } from "workbee-common";
import { AppRoutes } from "@/constants/routes/app-routes";
import { toast } from "sonner";

const Navbar = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const navigate = useNavigate();
  const socketConnectedRef = useRef(false);

  useEffect(() => {
    const verifyUser = async () => {
      const accessToken = AuthHelper.getAccessToken();
      const storedUser = AuthHelper.getUser();

      if (!accessToken) return;

      try {
        let loggedUser: IUser;

        if (storedUser) {
          loggedUser = storedUser;
        } else {
          const res = await AuthService.verifyUser();

          if (!res.data.success) {
            AuthHelper.clearAuth();
            setUser(null);
            return;
          }

          loggedUser = res.data.data;
        }

        // get profile data
        const profileResponse = await AuthService.getUserProfileData();

        if (profileResponse.data.success) {
          const profileData = profileResponse.data.data;

          loggedUser = {
            ...loggedUser,
            profileImage: profileData.userProfileImage || "",
          };
        }

        setUser(loggedUser);

        AuthHelper.setUser(loggedUser);
        AuthHelper.setUserId(loggedUser.id);

        // Connect notification socket
        if (!socketConnectedRef.current) {
          socketConnectedRef.current = true;
          notificationSocketService.connect(accessToken);
        }

      } catch (error) {
        console.error("User verification failed:", error);

        AuthHelper.clearAuth();
        setUser(null);
      }
    };

    verifyUser();

    return () => {
      socketConnectedRef.current = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      notificationSocketService.disconnect();
      AuthHelper.clearAuth();
      setUser(null);
      navigate(AppRoutes.USER.HOME);
      toast.warning('Logout Successfully')
    }
  };

  const handleNavigation = (path: string) => navigate(path);

  return (
    <header className="w-full flex justify-center mt-8">
      <nav className="w-[90%] max-w-8xl bg-white rounded-full shadow-sm border flex items-center justify-between px-6 py-3">
        {/* Brand */}
        <div className="text-2xl font-bold text-gray-900">WorkBee</div>

        {/* Links */}
        <ul className="flex space-x-8 text-gray-800 font-medium">
          <li>
            <button
              onClick={() => handleNavigation("/")}
              className="hover:text-black hover:font-semibold transition"
            >
              About Us
            </button>
          </li>

          <li>
            <button
              onClick={() => {
                if (user?.role?.includes(UserRole.WORKER)) {
                  handleNavigation("/worker/worker-dashboard");
                } else {
                  handleNavigation("/worker/apply-worker");
                }
              }}
              className="hover:text-black hover:font-semibold transition"
            >
              {user?.role?.includes(UserRole.WORKER)
                ? "Worker Dashboard"
                : "Apply to become a worker"}
            </button>
          </li>

          <li>
            <button
              onClick={() => handleNavigation("/questions")}
              className="hover:text-black hover:font-semibold transition"
            >
              How It Works
            </button>
          </li>
        </ul>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full border hover:bg-gray-100 transition">
            <Sun className="w-5 h-5" />
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <NotificationDropdown />
              <ProfileDropDownMenu user={user} onLogout={handleLogout} />
            </div>
          ) : (
            <Button
              onClick={() => handleNavigation("/login")}
              className="rounded-full px-5"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;