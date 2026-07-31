import { useState, useEffect } from "react"
import { Eye, X, Search, BookmarkIcon } from "lucide-react"
import { WorkService } from "@/services/work-service"
import { Toggle } from "../ui/toggle"

// Types
interface Applier {
    id: string
    name: string
    email: string
    phone: string
    location: string
    workType: string
    preferredWorks: string[]
    isBlocked?: boolean
    confirmations: {
        reliable: boolean
        honest: boolean
        termsAccepted: boolean
    }
    createdAt?: Date
}

// UI Components
const Button = ({
    children,
    onClick,
    variant = "default",
    size = "default",
    disabled = false,
    className = "",
    type = "button",
}: {
    children: React.ReactNode
    onClick?: () => void
    variant?: "default" | "outline" | "ghost"
    size?: "default" | "sm" | "icon"
    disabled?: boolean
    className?: string
    type?: "button" | "submit" | "reset"
}) => {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
    const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-700",
    }
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        icon: "h-10 w-10",
    }
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    )
}

const Input = ({
    value,
    onChange,
    placeholder,
    className = "",
}: {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    className?: string
}) => {
    return (
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        />
    )
}

const Badge = ({
    children,
    variant = "default",
}: {
    children: React.ReactNode
    variant?: "default" | "success" | "secondary"
}) => {
    const variants = {
        default: "bg-gray-100 text-gray-700",
        success: "bg-green-100 text-green-700",
        secondary: "bg-blue-100 text-blue-700",
    }
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
        >
            {children}
        </span>
    )
}

// Simple Select Component
const Select = ({
    value,
    onChange,
    children,
    className = ""
}: {
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${className}`}
        >
            {children}
        </select>
    );
};

// Modal Component
const Modal = ({
    isOpen,
    onClose,
    applier,
    onBlockUnblock,
}: {
    isOpen: boolean
    onClose: () => void
    applier: Applier | null
    onBlockUnblock: (applierId: string) => void
}) => {
    if (!isOpen || !applier) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{applier.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Worker Details</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <p className="mt-1 text-sm text-gray-900">{applier.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{applier.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <p className="mt-1 text-sm text-gray-900">{applier.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Location</label>
                            <p className="mt-1 text-sm text-gray-900">{applier.location}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Work Type</label>
                            <p className="mt-1">
                                <Badge variant="secondary">{applier.workType}</Badge>
                            </p>
                        </div>

                        {/* Status with Badge */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <div className="mt-1">
                                <span
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                                        ${applier.isBlocked
                                            ? "bg-red-100/80 text-red-700 border border-red-200"
                                            : "bg-green-100/80 text-green-700 border border-green-200"
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            w-2 h-2 rounded-full
                                            ${applier.isBlocked ? "bg-red-500" : "bg-green-500"}
                                        `}
                                    />
                                    {applier.isBlocked ? "Blocked" : "Active"}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Applied On</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {applier.createdAt
                                    ? new Date(applier.createdAt).toLocaleDateString()
                                    : "N/A"}
                            </p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="text-sm font-medium text-gray-700">Preferred Works</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {applier.preferredWorks?.length > 0 ? (
                                applier.preferredWorks.map((work, index) => (
                                    <Badge key={index}>{work}</Badge>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No preferred works listed</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onBlockUnblock(applier.id || "")}
                        className={
                            applier.isBlocked
                                ? "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                : "hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                        }
                    >
                        {applier.isBlocked ? "Unblock Worker" : "Block Worker"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Main Component
export default function WorkersManagementComponent() {
    const [workers, setWorkers] = useState<Applier[]>([])
    const [totalWorkers, setTotalWorkers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selectedApplier, setSelectedApplier] = useState<Applier | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Reset to first page when debounced search or status filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch, statusFilter])

    // Fetch workers with server-side pagination, search, and status filter
    const getAllWorkers = async () => {
        try {
            setLoading(true)
            const response = await WorkService.getAllWorkers(
                currentPage,
                itemsPerPage,
                debouncedSearch,
                statusFilter
            )

            if (response.data.success) {
                const data = response.data.data
                setWorkers(data.workers || [])
                setTotalWorkers(data.total || 0)
                setTotalPages(data.totalPages || 0)
            }
        } catch (error) {
            console.error("Error fetching all workers:", error)
            alert("Error while fetching all workers")
        } finally {
            setLoading(false)
        }
    }

    // Fetch workers when page, debounced search, or status filter changes
    useEffect(() => {
        getAllWorkers()
    }, [currentPage, debouncedSearch, statusFilter])

    const handleBlockUnblock = async (workerId: string) => {
        if (!workerId) {
            alert("Worker ID is missing")
            return
        }

        try {
            const res = await WorkService.blockWorker(workerId)

            if (res.data.success) {
                alert(selectedApplier?.isBlocked ? "Worker Unblocked" : "Worker Blocked")
                setIsModalOpen(false)
                getAllWorkers() // Refresh current page
            }
        } catch (error) {
            console.error("Error blocking/unblocking worker:", error)
            alert("Error occurred while updating worker status")
        }
    }

    const handleViewDetails = (applier: Applier) => {
        setSelectedApplier(applier)
        setIsModalOpen(true)
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleReset = () => {
        setSearchTerm("")
        setStatusFilter("all")
    }

    if (loading && workers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading workers...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-3">
                            {/* Search Bar */}
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by name, email, phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                                {/* Loading spinner inside input */}
                                {loading && searchTerm && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Status Filter - immediately next to search */}
                            <Select
                                value={statusFilter}
                                onChange={setStatusFilter}
                                className="w-[130px] flex-shrink-0"
                            >
                                <option value="all">Status</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                            </Select>

                            {/* Reset Button - next to filter */}
                            {(searchTerm || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={handleReset}
                                    size="sm"
                                    className="flex-shrink-0"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>


                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Approve
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && workers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : workers.length > 0 ? (
                                    workers.map((worker) => (
                                        <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {worker.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{worker.email}</td>

                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`
                                                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                                        ${worker.isBlocked
                                                            ? "bg-red-100/80 text-red-700 border border-red-200"
                                                            : "bg-green-100/80 text-green-700 border border-green-200"
                                                        }
                                                    `}
                                                >
                                                    <span
                                                        className={`
                                                            w-1.5 h-1.5 rounded-full
                                                            ${worker.isBlocked ? "bg-red-500" : "bg-green-500"}
                                                        `}
                                                    />
                                                    {worker.isBlocked ? "Blocked" : "Active"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <Toggle
                                                    aria-label="Toggle bookmark"
                                                    size="sm"
                                                    variant="outline"
                                                    className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-blue-500 data-[state=on]:*:[svg]:stroke-blue-500"
                                                >
                                                    <BookmarkIcon />
                                                    Approved
                                                </Toggle>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(worker)}
                                                    className="inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No workers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalWorkers > 0 && (
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(currentPage * itemsPerPage, totalWorkers)} of{" "}
                                {totalWorkers} workers
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-700 px-4">
                                    Page {currentPage} of {totalPages || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                applier={selectedApplier}
                onBlockUnblock={handleBlockUnblock}
            />
        </div>
    )
}