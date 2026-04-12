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
  UserCheck,
  UserPlus,
  Briefcase,
  MessageSquare,
  ShieldAlert,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  {
    title: "Dashboard",
    route: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Users",
    route: "/admin/dashboard/users",
    icon: Users,
  },
  {
    title: "Workers",
    route: "/admin/dashboard/workers",
    icon: UserCheck, 
  },
  {
    title: "New Appliers",
    route: "/admin/dashboard/new-appliers",
    icon: UserPlus,
  },
  {
    title: "Work Management",
    route: "/admin/dashboard/work",
    icon: Briefcase, 
  },
  {
    title: "Customer Feedbacks",
    route: "/admin/dashboard/feedbacks",
    icon: MessageSquare, 
  },
  {
    title: "Disputes",
    route: "/admin/dashboard/disputes",
    icon: ShieldAlert, 
  },
  {
    title: "Wallet",
    route: "/admin/dashboard/wallet",
    icon: Wallet,
  },
  {
    title: "Payments",
    route: "/admin/dashboard/payments",
    icon: CreditCard, 
  },
  {
    title: "Messages",
    route: "/admin/dashboard/feedbacks",
    icon: MessageSquare, 
  },
];

const AdminSidebar = () => {
    const navigate = useNavigate()
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    
                    <SidebarGroupLabel className="mb-3"><span className="text-base font-semibold">WorkBee Admin</span></SidebarGroupLabel>
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
                    name: "Admin",
                    email: "No email provided",
                    avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia",
                }} />
            </SidebarFooter>
        </Sidebar>
    )
}

export default AdminSidebar