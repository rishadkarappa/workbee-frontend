import { NavUser } from "../nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  Home,
  Users,
  MessageSquare,
  ShieldAlert,
  CreditCard,
  Bell,
  User,
  BriefcaseBusiness,
  HardHat
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  {
    title: "Dashboard",
    route: "/worker/worker-dashboard",
    icon: Home,
  },
  {
    title: "Works",
    route: "/worker/worker-dashboard/works",
    icon: BriefcaseBusiness,
  },    
  {
    title: "Active Works",
    route: "/worker/worker-dashboard/active-works",
    icon: HardHat,
  }, 
  {
    title: "Notifications",
    route: "/worker/worker-dashboard/new-appliers",
    icon: Bell,
  },
  {
    title: "Feedbacks",
    route: "/worker/worker-dashboard/feedbacks",
    icon: MessageSquare, 
  },
  {
    title: "Disputes",
    route: "/worker/worker-dashboard/disputes",
    icon: ShieldAlert, 
  },
  {
    title: "Wallet",
    route: "/worker/worker-dashboard/wallet",
    icon: CreditCard, 
  },
  {
    title: "Messages",
    route: "/worker/worker-dashboard/client-messages",
    icon: MessageSquare, 
  },
  {
    title: "Account Settings",
    route: "/workr/worker-dashboard/account",
    icon: User, 
  },
];

const WorkerSidebar = () => {
    const navigate = useNavigate()
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    
                    <SidebarGroupLabel className="mb-3"><span className="text-base font-semibold">WorkBee worker dashboard</span></SidebarGroupLabel>
                    
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}
                                    className={location.pathname.startsWith(item.route) ? "active" : ""}
                                >
                                    <SidebarMenuButton tooltip={item.title} onClick={() => navigate(item.route)}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={{
                    name: "Worker",
                    email: "No email provided",
                    avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia",
                }} />
            </SidebarFooter>
        </Sidebar>
    )
}

export default WorkerSidebar