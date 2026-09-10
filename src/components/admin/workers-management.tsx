import { useState, useEffect, useCallback } from "react";
import {Eye,X,Search,BookmarkIcon,Loader2,MapPin,Mail,Phone,Briefcase,CalendarDays,} from "lucide-react";

import { WorkService } from "@/services/work-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,} from "@/components/ui/dialog";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

// Types
interface Applier {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    workType: string;
    preferredWorks: string[];
    isBlocked?: boolean;
    confirmations: {
        reliable: boolean;
        honest: boolean;
        termsAccepted: boolean;
    };
    createdAt?: Date;
}

// Worker Details Dialog
const WorkerDetailsDialog = ({
    isOpen,
    onClose,
    applier,
    onBlockUnblock,
}: {
    isOpen: boolean;
    onClose: () => void;
    applier: Applier | null;
    onBlockUnblock: (applierId: string) => void;
}) => {
    if (!applier) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader className="pr-8">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                            <DialogTitle className="truncate text-xl">
                                {applier.name}
                            </DialogTitle>

                            <DialogDescription className="mt-1">
                                Worker details and application information
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Status */}
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Account status
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Current worker account state
                            </p>
                        </div>

                        <Badge
                            variant={applier.isBlocked ? "destructive" : "secondary"}
                            className={
                                !applier.isBlocked
                                    ? "border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
                                    : ""
                            }
                        >
                            <span
                                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                    applier.isBlocked
                                        ? "bg-current"
                                        : "bg-green-600 dark:bg-green-400"
                                }`}
                            />
                            {applier.isBlocked ? "Blocked" : "Active"}
                        </Badge>
                    </div>

                    {/* Worker Information */}
                    <div>
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Personal information
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Basic information provided by the worker.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <InfoItem
                                icon={Briefcase}
                                label="Name"
                                value={applier.name}
                            />

                            <InfoItem
                                icon={Mail}
                                label="Email"
                                value={applier.email}
                            />

                            <InfoItem
                                icon={Phone}
                                label="Phone"
                                value={applier.phone}
                            />

                            <InfoItem
                                icon={MapPin}
                                label="Location"
                                value={applier.location}
                            />

                            <InfoItem
                                icon={Briefcase}
                                label="Work Type"
                                value={
                                    <Badge variant="secondary">
                                        {applier.workType}
                                    </Badge>
                                }
                            />

                            <InfoItem
                                icon={CalendarDays}
                                label="Applied On"
                                value={
                                    applier.createdAt
                                        ? new Date(
                                              applier.createdAt
                                          ).toLocaleDateString()
                                        : "N/A"
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Preferred Works */}
                    <div>
                        <div className="mb-3">
                            <h3 className="text-sm font-semibold text-foreground">
                                Preferred works
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Types of work the worker is interested in.
                            </p>
                        </div>

                        {applier.preferredWorks?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {applier.preferredWorks.map((work, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-muted/40"
                                    >
                                        {work}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No preferred works listed.
                            </p>
                        )}
                    </div>

                    {/* Confirmations */}
                    <div>
                        <div className="mb-3">
                            <h3 className="text-sm font-semibold text-foreground">
                                Confirmations
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Worker application confirmations.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                            <ConfirmationItem
                                label="Reliable"
                                value={applier.confirmations.reliable}
                            />

                            <ConfirmationItem
                                label="Honest"
                                value={applier.confirmations.honest}
                            />

                            <ConfirmationItem
                                label="Terms accepted"
                                value={applier.confirmations.termsAccepted}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onBlockUnblock(applier.id)}
                        className={
                            applier.isBlocked
                                ? "hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:hover:border-green-900 dark:hover:bg-green-950 dark:hover:text-green-400"
                                : "hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        }
                    >
                        {applier.isBlocked
                            ? "Unblock Worker"
                            : "Block Worker"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Information Item
const InfoItem = ({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) => {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="mb-1.5 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />

                <span className="text-xs font-medium text-muted-foreground">
                    {label}
                </span>
            </div>

            <div className="text-sm font-medium text-foreground">
                {value}
            </div>
        </div>
    );
};

// Confirmation Item
const ConfirmationItem = ({
    label,
    value,
}: {
    label: string;
    value: boolean;
}) => {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
            <span className="text-sm text-foreground">{label}</span>

            <Badge
                variant="outline"
                className={
                    value
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
                        : "border-border bg-muted text-muted-foreground"
                }
            >
                {value ? "Yes" : "No"}
            </Badge>
        </div>
    );
};

// Main Component
export default function WorkersManagementComponent() {
    const [workers, setWorkers] = useState<Applier[]>([]);
    const [totalWorkers, setTotalWorkers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedApplier, setSelectedApplier] =
        useState<Applier | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to first page when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter]);

    // Get all workers
    const getAllWorkers = useCallback(async () => {
        try {
            setLoading(true);

            const response = await WorkService.getAllWorkers(
                currentPage,
                itemsPerPage,
                debouncedSearch,
                statusFilter
            );

            if (response.data.success) {
                const data = response.data.data;

                setWorkers(data.workers || []);
                setTotalWorkers(data.total || 0);
                setTotalPages(data.totalPages || 0);
            }
        } catch (error) {
            console.error("Error fetching all workers:", error);
            alert("Error while fetching all workers");
        } finally {
            setLoading(false);
        }
    }, [
        currentPage,
        itemsPerPage,
        debouncedSearch,
        statusFilter,
    ]);

    useEffect(() => {
        getAllWorkers();
    }, [getAllWorkers]);

    // Block / unblock worker
    const handleBlockUnblock = async (workerId: string) => {
        if (!workerId) {
            alert("Worker ID is missing");
            return;
        }

        try {
            const res = await WorkService.blockWorker(workerId);

            if (res.data.success) {
                alert(
                    selectedApplier?.isBlocked
                        ? "Worker Unblocked"
                        : "Worker Blocked"
                );

                setIsModalOpen(false);
                getAllWorkers();
            }
        } catch (error) {
            console.error(
                "Error blocking/unblocking worker:",
                error
            );

            alert("Error occurred while updating worker status");
        }
    };

    const handleViewDetails = (applier: Applier) => {
        setSelectedApplier(applier);
        setIsModalOpen(true);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleReset = () => {
        setSearchTerm("");
        setStatusFilter("all");
    };

    if (loading && workers.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center text-center">
                    <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />

                    <p className="text-sm text-muted-foreground">
                        Loading workers...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    {/* Toolbar */}
                    <div className="border-b p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {/* Search */}
                            <div className="relative min-w-0 flex-1 sm:max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search by name, email, phone..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-9 pr-9"
                                />

                                {loading && searchTerm && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>

                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>

                                    <SelectItem value="blocked">
                                        Blocked
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Reset */}
                            {(searchTerm || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="shrink-0"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Name
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Email
                                    </th>

                                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Approve
                                    </th>

                                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Details
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {loading && workers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                                        </td>
                                    </tr>
                                ) : workers.length > 0 ? (
                                    workers.map((worker) => (
                                        <tr
                                            key={worker.id}
                                            className="transition-colors hover:bg-muted/40"
                                        >
                                            {/* Name */}
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="font-medium text-foreground">
                                                    {worker.name}
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {worker.email}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        worker.isBlocked
                                                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                                                            : "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
                                                    }
                                                >
                                                    <span
                                                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                                            worker.isBlocked
                                                                ? "bg-destructive"
                                                                : "bg-green-500"
                                                        }`}
                                                    />

                                                    {worker.isBlocked
                                                        ? "Blocked"
                                                        : "Active"}
                                                </Badge>
                                            </td>

                                            {/* Approve */}
                                            <td className="px-6 py-4 text-center">
                                                <Toggle
                                                    aria-label="Toggle approval"
                                                    size="sm"
                                                    variant="outline"
                                                    className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary"
                                                >
                                                    <BookmarkIcon />
                                                    Approved
                                                </Toggle>
                                            </td>

                                            {/* Details */}
                                            <td className="px-6 py-4 text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewDetails(
                                                            worker
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    <Search className="h-5 w-5 text-muted-foreground" />
                                                </div>

                                                <p className="text-sm font-medium text-foreground">
                                                    No workers found
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Try changing your search
                                                    or filter.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalWorkers > 0 && (
                        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing{" "}
                                {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(
                                    currentPage * itemsPerPage,
                                    totalWorkers
                                )}{" "}
                                of {totalWorkers} workers
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={
                                        currentPage === 1 || loading
                                    }
                                >
                                    Previous
                                </Button>

                                <div className="min-w-[110px] text-center text-sm text-muted-foreground">
                                    Page {currentPage} of{" "}
                                    {totalPages || 1}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={
                                        currentPage >= totalPages ||
                                        loading
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Worker Details */}
            <WorkerDetailsDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                applier={selectedApplier}
                onBlockUnblock={handleBlockUnblock}
            />
        </div>
    );
}