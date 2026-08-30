import { Separator } from "@/components/ui/separator"
import { CalendarRange, LucideLayoutDashboard, LucideWorkflow, MessagesSquare, Notebook, User, Wallet2Icon } from "lucide-react"
import { Outlet, useLocation } from "react-router-dom"
import SidebarNav from "./user-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const UserDashboard = () => {
    const location = useLocation()

    const getBreadcrumbs = () => {
        const breadcrumbs: {
            title: string
            href: string
            current: boolean
        }[] = []

        const pathname = location.pathname

        if (pathname.startsWith('/user-dashboard')) {
            breadcrumbs.push({
                title: 'Dashboard',
                href: '/user-dashboard/works',
                current: false,
            })
        }

        const matchingItem = sidebarNavItems.find(
            item => item.href.toLowerCase() === pathname.toLowerCase()
        )

        if (matchingItem) {
            breadcrumbs.push({
                title: matchingItem.title,
                href: pathname,
                current: true,
            })
        }

        return breadcrumbs
    }

    const breadcrumbs = getBreadcrumbs()

    return (
        <div className="px-4 py-6">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {breadcrumbs.map((breadcrumb) => (
                        <BreadcrumbItem key={breadcrumb.href}>
                            {breadcrumb.current ? (
                                <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                            ) : (
                                <>
                                    <BreadcrumbLink href={breadcrumb.href}>
                                        {breadcrumb.title}
                                    </BreadcrumbLink>
                                    <BreadcrumbSeparator />
                                </>
                            )}
                        </BreadcrumbItem>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>

            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className="my-4 lg:my-6" />
            <div className="flex flex-1 flex-col space-y-2 md:space-y-2 overflow-hidden lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="top-0 lg:sticky lg:w-1/5">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex w-full p-1 pr-4 overflow-y-hidden">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

const sidebarNavItems = [
    {
        title: 'My Works',
        icon: <LucideLayoutDashboard size={18} />,
        href: '/user-dashboard/works',
    },
    {
        title: 'Wallet',
        icon: <Wallet2Icon size={18} />,
        href: '/user-dashboard/user-wallet',
    },
    // {
    //     title: 'My Works',
    //     icon: <WorkflowIcon size={18} />,
    //     href: '/user-dashboard/works',
    // },
    {
        title: 'Active Works',
        icon: <LucideWorkflow size={18} />,
        href: '/user-dashboard/active-works',
    },
    {
        title: 'Messages',
        icon: <MessagesSquare size={18} />,
        href: '/user-dashboard/messages',
    },
    {
        title: 'Post a Work',
        icon: <CalendarRange size={18} />,
        href: '/user-dashboard/task-booking',
    },
    {
        title: 'History',
        icon: <Notebook size={18} />,
        href: '/user/dashboard/history',
    },
    {
        title: 'Account Settings',
        icon: <User size={18} />,
        href: '/user-dashboard/profile-settings',
    },
]

export default UserDashboard