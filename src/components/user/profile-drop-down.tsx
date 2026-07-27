import {
    Bell,
    CreditCard,
    LayoutDashboard,
    Lock,
    LogOut,
    Mail,
    User,
    Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import type { IUser } from "@workbee/common";

interface ProfileDropDownMenuProps {
    user: IUser;
    onLogout: () => void;
}

const ProfileDropDownMenu = ({ user, onLogout }: ProfileDropDownMenuProps) => {
    const getInitials = (name: string) => {
        if (!name) return "U";
        const names = name.split(" ");
        return names.length > 1
            ? `${names[0][0]}${names[1][0]}`.toUpperCase()
            : names[0][0].toUpperCase();
    };

    const userName = user?.name || "User";
    const userEmail = user?.email || "user@example.com";
    const profilePic = user?.profileImage || "";

    const navigate = useNavigate()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full border hover:bg-gray-100 transition">
                    <Avatar className="h-5 w-5">
                        <AvatarImage alt={userName} src={profilePic} />
                        <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 pb-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage alt={userName} src={profilePic} />
                            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <p className="font-medium text-sm leading-none">{userName}</p>
                            <p className="text-muted-foreground text-xs leading-none">
                                {userEmail}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate("/user-dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        My Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <User />
                        Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Bell />
                        Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Mail />
                        Email Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Lock />
                        Privacy & Security
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Billing</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <CreditCard />
                        Payment Methods
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Users />
                        Team Subscription
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onLogout}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProfileDropDownMenu;