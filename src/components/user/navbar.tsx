import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";

import { AuthService } from "@/services/auth-service";
import ProfileDropDownMenu from "./profile-drop-down";
import NotificationDropdown from "./NotificationDropdown";
import { AuthHelper } from "@/utils/auth-helper";
import { notificationSocketService } from "@/services/notification-socket-service";
import { UserRole, type IUser } from "workbee-common";
import { AppRoutes } from "@/constants/routes/app-routes";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [user, setUser] = useState<IUser | null>(null);

  const navigate = useNavigate();
  const socketConnectedRef = useRef(false);

  const { setTheme } = useTheme();

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

        // Get profile data
        const profileResponse =
          await AuthService.getUserProfileData();

        if (profileResponse.data.success) {
          const profileData = profileResponse.data.data;

          loggedUser = {
            ...loggedUser,
            profileImage:
              profileData.userProfileImage || "",
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
        console.error(
          "User verification failed:",
          error
        );

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

      toast.warning("Logout Successfully");
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <header className="w-full flex justify-center mt-8 px-4">
      <nav
        className="
          w-full
          max-w-7xl
          bg-background
          text-foreground
          border
          border-border
          rounded-full
          shadow-sm
          flex
          items-center
          justify-between
          px-6
          py-3
          transition-colors
        "
      >
        {/*  BRAND  */}
        <button
          onClick={() =>
            handleNavigation(AppRoutes.USER.HOME)
          }
          className="
            text-2xl
            font-bold
            tracking-tight
            text-foreground
            hover:opacity-80
            transition
          "
        >
          WorkBee
        </button>

        {/*  NAVIGATION LINKS  */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
          {/* About */}
          <li>
            <button
              onClick={() =>
                handleNavigation("/")
              }
              className="
                text-muted-foreground
                hover:text-foreground
                transition-colors
              "
            >
              About Us
            </button>
          </li>

          {/* Worker */}
          <li>
            <button
              onClick={() => {
                if (
                  user?.role?.includes(
                    UserRole.WORKER
                  )
                ) {
                  handleNavigation(
                    "/worker/worker-dashboard"
                  );
                } else {
                  handleNavigation(
                    "/worker/apply-worker"
                  );
                }
              }}
              className="
                text-muted-foreground
                hover:text-foreground
                transition-colors
              "
            >
              {user?.role?.includes(
                UserRole.WORKER
              )
                ? "Worker Dashboard"
                : "Apply to become a worker"}
            </button>
          </li>

          {/* How It Works */}
          <li>
            <button
              onClick={() =>
                handleNavigation("/questions")
              }
              className="
                text-muted-foreground
                hover:text-foreground
                transition-colors
              "
            >
              How It Works
            </button>
          </li>
        </ul>

        {/*  RIGHT SIDE  */}
        <div className="flex items-center gap-3">
          {/*  THEME SWITCHER  */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="
                  rounded-full
                  border-border
                  hover:bg-accent
                  hover:text-accent-foreground
                "
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

                <span className="sr-only">
                  Toggle theme
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-36"
            >
              {/* Light */}
              <DropdownMenuItem
                onClick={() =>
                  setTheme("light")
                }
                className="cursor-pointer"
              >
                <Sun className="mr-2 h-4 w-4" />

                <span>Light</span>
              </DropdownMenuItem>

              {/* Dark */}
              <DropdownMenuItem
                onClick={() =>
                  setTheme("dark")
                }
                className="cursor-pointer"
              >
                <Moon className="mr-2 h-4 w-4" />

                <span>Dark</span>
              </DropdownMenuItem>

              {/* System */}
              <DropdownMenuItem
                onClick={() =>
                  setTheme("system")
                }
                className="cursor-pointer"
              >
                <Monitor className="mr-2 h-4 w-4" />

                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/*  AUTHENTICATED USER  */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Profile */}
              <ProfileDropDownMenu
                user={user}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            /*  SIGN IN  */
            <Button
              onClick={() =>
                handleNavigation("/login")
              }
              className="
                rounded-full
                px-5
              "
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