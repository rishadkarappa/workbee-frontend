import { WorkService } from "@/services/work-service";
import { useEffect, useState } from "react";
import {
    Edit,
    Trash2,
    Calendar,
    MapPin,
    Briefcase,
    IndianRupeeIcon,
    Loader2,
    AlertCircle,
    Mic,
    ListChecks,
    TrendingUp,
    CheckCircle2,
    Clock3,
    Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getErrorMessage } from "@/utils/error-helper";
import { useMyWorks, type WorkItem } from "@/hooks/useMyWorks";

type Bucket = 'all' | 'active' | 'completed' | 'pending' | 'cancelled';

const TAB_CONFIG: { value: Bucket; label: string; Icon: any }[] = [
    { value: 'all', label: 'All Works', Icon: ListChecks },
    { value: 'active', label: 'Active', Icon: TrendingUp },
    { value: 'completed', label: 'Completed', Icon: CheckCircle2 },
    { value: 'pending', label: 'Pending', Icon: Clock3 },
    { value: 'cancelled', label: 'Cancelled', Icon: Ban },
];

const ITEMS_PER_PAGE = 6;

export interface UpdateWorkDto {
    workTitle?: string;
    workCategory?: string;
    workType?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    status?: string;
    workerId?: string;
    manualAddress?: string;
    landmark?: string;
}

interface EditModalProps {
    work: WorkItem;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

/*                              EDIT WORK MODAL                               */

function EditModal({ work, isOpen, onClose, onUpdated }: EditModalProps) {
    const [formData, setFormData] = useState<WorkItem>(work);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(work);
    }, [work]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "budget" ? (value ? Number(value) : undefined) : value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, status: value }));
    };

    const handleSubmit = async () => {
        if (!formData.workTitle || !formData.workCategory || !formData.workType) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await WorkService.updateWork(formData.id, formData);
            if (response.data.success) {
                onUpdated();
                onClose();
                alert("Work updated successfully!");
            } else {
                alert(response.data.message || "Failed to update work");
            }
        } catch (error) {
            console.error("Error updating work:", error);
            alert(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl md:max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Edit Work</DialogTitle>
                    <DialogDescription>Update your work details below.</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="workTitle">Work Title *</Label>
                        <Input id="workTitle" name="workTitle" value={formData.workTitle} onChange={handleChange} required />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="workCategory">Category *</Label>
                            <Input id="workCategory" name="workCategory" value={formData.workCategory} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workType">Type *</Label>
                            <Input id="workType" name="workType" value={formData.workType} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input id="startDate" name="startDate" type="date" value={formData.startDate || ""} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input id="endDate" name="endDate" type="date" value={formData.endDate || ""} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget (₹)</Label>
                            <Input id="budget" name="budget" type="number" value={formData.budget || ""} onChange={handleChange} min="0" step="0.01" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status || "pending"} onValueChange={handleSelectChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Real statuses only — "active" was never a valid value in
                                        the backend, which is what broke the My Works tab before. */}
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Assigned / in-progress / completed are set automatically as the worker updates progress.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description || ""} onChange={handleChange} rows={4} className="resize-none" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="manualAddress">Address</Label>
                        <Input id="manualAddress" name="manualAddress" value={formData.manualAddress || ""} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark</Label>
                        <Input id="landmark" name="landmark" value={formData.landmark || ""} onChange={handleChange} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Updating..." : "Update Work"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/*                                WORK CARD                                   */

function WorkCard({
    work,
    onEdit,
    onDelete,
    getStatusColor,
}: {
    work: WorkItem;
    onEdit: (work: WorkItem) => void;
    onDelete: (workId: string) => void;
    getStatusColor: (status?: string) => string;
}) {
    return (
        <Card className="w-full border-border bg-card transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <CardTitle className="break-words text-xl sm:text-2xl">{work.workTitle}</CardTitle>
                        <CardDescription>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                    <Briefcase className="mr-1 h-3 w-3" />
                                    {work.workCategory}
                                </Badge>
                                <Badge variant="outline">{work.workType}</Badge>
                                {work.status && (
                                    <Badge variant="outline" className={getStatusColor(work.status)}>
                                        {work.status}
                                    </Badge>
                                )}
                            </div>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {work.startDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">Start:</span>
                            <span className="text-foreground">{new Date(work.startDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    {work.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">End:</span>
                            <span className="text-foreground">{new Date(work.endDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    {work.budget !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                            <IndianRupeeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="font-semibold text-foreground">₹{work.budget}</span>
                        </div>
                    )}
                </div>

                {(work.description || work.manualAddress || work.landmark) && (
                    <div className="grid grid-cols-1 gap-5 border-t border-border pt-4 md:grid-cols-2">
                        {work.description && (
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-sm leading-6 text-muted-foreground">{work.description}</p>
                            </div>
                        )}
                        {(work.manualAddress || work.landmark) && (
                            <div className="space-y-3">
                                {work.manualAddress && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">Address: </span>
                                            <span className="text-foreground">{work.manualAddress}</span>
                                        </div>
                                    </div>
                                )}
                                {work.landmark && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">Landmark: </span>
                                            <span className="text-foreground">{work.landmark}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {work.voiceFile?.url && (
                    <div className="border-t border-border pt-4">
                        <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <Mic className="h-4 w-4" />
                            Voice Note
                        </Label>
                        <audio controls src={work.voiceFile.url} className="w-full max-w-sm dark:[color-scheme:dark]" />
                    </div>
                )}

                {((work.images && work.images.length > 0) || (work.videos && work.videos.length > 0)) && (
                    <div className="border-t border-border pt-4">
                        <Label className="text-sm font-medium mb-2 block">Media</Label>
                        <div className="flex flex-wrap gap-2">
                            {work.images?.map((img) => (
                                <a key={img.publicId} href={img.url} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90">
                                    <img src={img.url} alt="work" className="h-full w-full object-cover" />
                                </a>
                            ))}
                            {work.videos?.map((vid) => (
                                <video key={vid.publicId} src={vid.url} className="h-16 w-16 rounded-md object-cover border border-border bg-black" muted controls />
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => onEdit(work)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => onDelete(work.id)}
                        className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/*                              MAIN COMPONENT                                */

export default function WorkContent() {
    const [activeTab, setActiveTab] = useState<Bucket>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteWorkId, setDeleteWorkId] = useState<string | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const { works, pagination, counts, loading, error, refetch } = useMyWorks({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        bucket: activeTab,
    });

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "completed":
                return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
            case "assigned":
                return "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400";
            case "in-progress":
                return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "pending":
                return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
            case "cancelled":
                return "border-destructive/30 bg-destructive/10 text-destructive";
            default:
                return "border-border bg-muted text-muted-foreground";
        }
    };

    const handleEdit = (work: WorkItem) => {
        setEditingWork(work);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWork(null);
    };

    // A status edit can move the work into a different tab/bucket — refetch
    // rather than splice locally so counts and pagination stay correct.
    const handleUpdated = () => {
        refetch();
    };

    const handleDelete = async () => {
        if (!deleteWorkId) return;
        try {
            const res = await WorkService.deleteMyWork(deleteWorkId);
            if (res.data.success) {
                alert("Deleted successfully");
                await refetch();
            } else {
                alert("Error while deleting work");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert(getErrorMessage(error));
        } finally {
            setDeleteWorkId(null);
        }
    };

    const getPageNumbers = (): (number | 'ellipsis')[] => {
        const totalPages = pagination.totalPages;
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | 'ellipsis')[] = [1];
        if (currentPage > 3) pages.push('ellipsis');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('ellipsis');
        pages.push(totalPages);
        return pages;
    };

    if (loading && works.length === 0 && counts.all === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex min-h-[240px] items-center justify-center">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading your works...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive/30 bg-card">
                <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-full bg-destructive/10 p-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">Unable to load works</h3>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (counts.all === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">My Works</h1>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        No works found. Start by posting your first work!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Bucket)} className="w-full space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5">
                    {TAB_CONFIG.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
                            <tab.Icon className="h-3.5 w-3.5" />
                            {tab.label}
                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                                {counts[tab.value] ?? 0}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {loading ? (
                <Card className="border-border bg-card">
                    <CardContent className="flex min-h-[160px] items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : works.length === 0 ? (
                <Card className="border-dashed border-border bg-card">
                    <CardContent className="flex min-h-[160px] items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            No {TAB_CONFIG.find(t => t.value === activeTab)?.label.toLowerCase()} works.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid w-full gap-4">
                        {works.map((work) => (
                            <WorkCard
                                key={work.id}
                                work={work}
                                onEdit={handleEdit}
                                onDelete={() => setDeleteWorkId(work.id)}
                                getStatusColor={getStatusColor}
                            />
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>

                                {getPageNumbers().map((page, idx) =>
                                    page === 'ellipsis' ? (
                                        <PaginationItem key={`ellipsis-${idx}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    ) : (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === currentPage}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(page);
                                                }}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage < pagination.totalPages) setCurrentPage(currentPage + 1);
                                        }}
                                        className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            {editingWork && (
                <EditModal
                    work={editingWork}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onUpdated={handleUpdated}
                />
            )}

            <AlertDialog open={!!deleteWorkId} onOpenChange={(open) => { if (!open) setDeleteWorkId(null); }}>
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this work?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The work will be permanently removed from your works list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}