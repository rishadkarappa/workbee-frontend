import { Navigate, useLocation } from "react-router-dom";
import { AuthHelper } from "@/utils/auth-helper";
import { useEffect, useState } from "react";
import { UserRole } from "workbee-common";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = AuthHelper.isLoggedIn();
      const userRole = AuthHelper.getUserRole();

      console.log("Protected Route Check:", {
        path: location.pathname,
        isLoggedIn,
        userRole,
        allowedRoles
      });

      // Not logged in - redirect to login
      if (!isLoggedIn) {
        if (allowedRoles.includes(UserRole.ADMIN)) {
          setRedirectPath("/admin");
        } else if (allowedRoles.includes(UserRole.WORKER)) {
          setRedirectPath("/worker/worker-login");
        } else {
          setRedirectPath("/login");
        }
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Logged in - check role
      if (userRole && allowedRoles.includes(userRole as UserRole)) {
        setIsAuthorized(true);
      } else {
        // Wrong role - redirect to their dashboard
        if (userRole === "admin") {
          setRedirectPath("/admin/dashboard");
        } else if (userRole === "worker") {
          setRedirectPath("/worker/worker-dashboard");
        } else {
          setRedirectPath("/");
        }
        setIsAuthorized(false);
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [allowedRoles, location.pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log("Access Denied - Redirecting to:", redirectPath);
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
