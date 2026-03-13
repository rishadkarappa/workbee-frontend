import { useEffect, useRef } from "react";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import WorkerSidebar from "@/components/worker/worker-sidebar";
import { Outlet } from "react-router-dom";
import { AuthHelper } from "@/utils/auth-helper";
import { notificationSocketService } from "@/services/notification-socket-service";

export default function WorkerLayout() {
  const socketConnectedRef = useRef(false);

  useEffect(() => {
    const accessToken = AuthHelper.getAccessToken();
    if (accessToken && !socketConnectedRef.current) {
      socketConnectedRef.current = true;
      notificationSocketService.connect(accessToken);
    }

    return () => {
      // Reset on unmount so a fresh mount can reconnect (handles React StrictMode)
      socketConnectedRef.current = false;
    };
  }, []);

  return (
    <div>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-muted/30">
          <WorkerSidebar />
          <div className="flex flex-1 flex-col w-full min-w-0">
            <SiteHeader />
            <div className="flex-1 p-6 w-full">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}