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

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

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

interface MediaItem {
    url: string;
    publicId: string;
}

interface Work {
    id: string;
    userId: string;
    workTitle: string;
    workCategory: string;
    workType: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    time?: string;
    images?: MediaItem[];
    videos?: MediaItem[];
    description?: string;
    location?: {
        type: string;
        coordinates: [number, number];
    };
    manualAddress?: string;
    landmark?: string;
    budget?: number;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

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
    work: Work;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedWork: Work) => void;
}

/*                              EDIT WORK MODAL                               */

function EditModal({
    work,
    isOpen,
    onClose,
    onUpdate,
}: EditModalProps) {
    const [formData, setFormData] = useState<Work>(work);
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
            [name]:
                name === "budget"
                    ? value
                        ? Number(value)
                        : undefined
                    : value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            status: value,
        }));
    };

    const handleSubmit = async () => {
        if (
            !formData.workTitle ||
            !formData.workCategory ||
            !formData.workType
        ) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await WorkService.updateWork(
                formData.id,
                formData
            );

            if (response.data.success) {
                onUpdate(formData);
                onClose();
                alert("Work updated successfully!");
            } else {
                alert(
                    response.data.message ||
                    "Failed to update work"
                );
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
                    <DialogTitle className="text-foreground">
                        Edit Work
                    </DialogTitle>

                    <DialogDescription>
                        Update your work details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Work Title */}
                    <div className="space-y-2">
                        <Label htmlFor="workTitle">
                            Work Title *
                        </Label>

                        <Input
                            id="workTitle"
                            name="workTitle"
                            value={formData.workTitle}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Category / Type */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="workCategory">
                                Category *
                            </Label>

                            <Input
                                id="workCategory"
                                name="workCategory"
                                value={formData.workCategory}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workType">
                                Type *
                            </Label>

                            <Input
                                id="workType"
                                name="workType"
                                value={formData.workType}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">
                                Start Date
                            </Label>

                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">
                                End Date
                            </Label>

                            <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={formData.endDate || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Budget / Status */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="budget">
                                Budget (₹)
                            </Label>

                            <Input
                                id="budget"
                                name="budget"
                                type="number"
                                value={formData.budget || ""}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">
                                Status
                            </Label>

                            <Select
                                value={
                                    formData.status || "active"
                                }
                                onValueChange={
                                    handleSelectChange
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>

                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>

                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>

                                    <SelectItem value="cancelled">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description
                        </Label>

                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description || ""}
                            onChange={handleChange}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="manualAddress">
                            Address
                        </Label>

                        <Input
                            id="manualAddress"
                            name="manualAddress"
                            value={formData.manualAddress || ""}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Landmark */}
                    <div className="space-y-2">
                        <Label htmlFor="landmark">
                            Landmark
                        </Label>

                        <Input
                            id="landmark"
                            name="landmark"
                            value={formData.landmark || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        {isSubmitting
                            ? "Updating..."
                            : "Update Work"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/*                                WORK CARD                                   */

interface WorkCardProps {
    work: Work;
    onEdit: (work: Work) => void;
    onDelete: (workId: string) => void;
    getStatusColor: (status?: string) => string;
}

function WorkCard({
    work,
    onEdit,
    onDelete,
    getStatusColor,
}: WorkCardProps) {
    return (
        <Card className="w-full border-border bg-card transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <CardTitle className="break-words text-xl sm:text-2xl">
                            {work.workTitle}
                        </CardTitle>

                        <CardDescription>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                    <Briefcase className="mr-1 h-3 w-3" />
                                    {work.workCategory}
                                </Badge>

                                <Badge variant="outline">
                                    {work.workType}
                                </Badge>

                                {work.status && (
                                    <Badge
                                        variant="outline"
                                        className={getStatusColor(
                                            work.status
                                        )}
                                    >
                                        {work.status}
                                    </Badge>
                                )}
                            </div>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Work Meta */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {work.startDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />

                            <span className="text-muted-foreground">
                                Start:
                            </span>

                            <span className="text-foreground">
                                {new Date(
                                    work.startDate
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    {work.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />

                            <span className="text-muted-foreground">
                                End:
                            </span>

                            <span className="text-foreground">
                                {new Date(
                                    work.endDate
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    {work.budget !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                            <IndianRupeeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />

                            <span className="text-muted-foreground">
                                Budget:
                            </span>

                            <span className="font-semibold text-foreground">
                                ₹{work.budget}
                            </span>
                        </div>
                    )}
                </div>

                {/* Description / Address */}
                {(work.description ||
                    work.manualAddress ||
                    work.landmark) && (
                        <div className="grid grid-cols-1 gap-5 border-t border-border pt-4 md:grid-cols-2">
                            {work.description && (
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">
                                        Description
                                    </Label>

                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {work.description}
                                    </p>
                                </div>
                            )}

                            {(work.manualAddress ||
                                work.landmark) && (
                                    <div className="space-y-3">
                                        {work.manualAddress && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Address:{" "}
                                                    </span>

                                                    <span className="text-foreground">
                                                        {
                                                            work.manualAddress
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {work.landmark && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Landmark:{" "}
                                                    </span>

                                                    <span className="text-foreground">
                                                        {work.landmark}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    )}

                {/* Media Preview */}
                {((work.images && work.images.length > 0) ||
                    (work.videos && work.videos.length > 0)) && (
                        <div className="border-t border-border pt-4">
                            <Label className="text-sm font-medium mb-2 block">
                                Media
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {work.images?.map((img) => (
                                    <a
                                        key={img.publicId}
                                        href={img.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-16 w-16 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90"
                                    >
                                        <img
                                            src={img.url}
                                            alt="work"
                                            className="h-full w-full object-cover"
                                        />
                                    </a>
                                ))}

                                {work.videos?.map((vid) => (
                                    <video
                                        key={vid.publicId}
                                        src={vid.url}
                                        className="h-16 w-16 rounded-md object-cover border border-border bg-black"
                                        muted
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onEdit(work)}
                    >
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
    const [works, setWorksData] = useState<Work[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingWork, setEditingWork] =
        useState<Work | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [deleteWorkId, setDeleteWorkId] =
        useState<string | null>(null);

    const getAllWorks = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await WorkService.getMyWorks();

            if (res.data.success) {
                setWorksData(
                    res.data.data.works || []
                );
            } else {
                setError(
                    "Error while fetching works data"
                );
            }
        } catch (error) {
            console.error(
                "Error fetching works:",
                error
            );

            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAllWorks();
    }, []);

    const handleEdit = (work: Work) => {
        setEditingWork(work);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWork(null);
    };

    const handleUpdate = (updatedWork: Work) => {
        setWorksData((prevWorks) =>
            prevWorks.map((work) =>
                work.id === updatedWork.id
                    ? updatedWork
                    : work
            )
        );
    };

    const handleDelete = async () => {
        if (!deleteWorkId) return;

        try {
            const res =
                await WorkService.deleteMyWork(
                    deleteWorkId
                );

            if (res.data.success) {
                alert("Deleted successfully");

                setWorksData((prev) =>
                    prev.filter(
                        (work) =>
                            work.id !== deleteWorkId
                    )
                );
            } else {
                alert(
                    "Error while deleting work"
                );
            }
        } catch (error) {
            console.error(
                "Delete error:",
                error
            );

            alert(getErrorMessage(error));
        } finally {
            setDeleteWorkId(null);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "completed":
                return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

            case "active":
                return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";

            case "pending":
                return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";

            case "cancelled":
                return "border-destructive/30 bg-destructive/10 text-destructive";

            default:
                return "border-border bg-muted text-muted-foreground";
        }
    };

    const filterWorksByStatus = (
        status?: string
    ) => {
        if (!status) return works;

        return works.filter(
            (work) => work.status === status
        );
    };

    /*                                LOADING                                 */

    if (loading) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex min-h-[240px] items-center justify-center">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />

                        <span>
                            Loading your works...
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    /*                                  ERROR                                 */

    if (error) {
        return (
            <Card className="border-destructive/30 bg-card">
                <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-full bg-destructive/10 p-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>

                    <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">
                            Unable to load works
                        </h3>

                        <p className="text-sm text-muted-foreground">
                            {error}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    /*                               EMPTY STATE                              */

    if (!works || works.length === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        My Works
                    </h1>

                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        No works found. Start by posting
                        your first work!
                    </p>
                </CardContent>
            </Card>
        );
    }

    /*                              WORKS LIST                                */

    const WorksList = ({
        filteredWorks,
    }: {
        filteredWorks: Work[];
    }) => (
        <div className="grid w-full gap-4">
            {filteredWorks.length > 0 ? (
                filteredWorks.map((work) => (
                    <WorkCard
                        key={work.id}
                        work={work}
                        onEdit={handleEdit}
                        onDelete={() =>
                            setDeleteWorkId(work.id)
                        }
                        getStatusColor={
                            getStatusColor
                        }
                    />
                ))
            ) : (
                <Card className="border-dashed border-border bg-card">
                    <CardContent className="flex min-h-[160px] items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            No works found.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <Tabs
                defaultValue="all"
                className="w-full space-y-6"
            >
                <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
                    <TabsTrigger value="all">
                        All Works
                    </TabsTrigger>

                    <TabsTrigger value="active">
                        Active
                    </TabsTrigger>

                    <TabsTrigger value="completed">
                        Completed
                    </TabsTrigger>

                    <TabsTrigger value="pending">
                        Pending
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="all"
                    className="space-y-4"
                >
                    <WorksList
                        filteredWorks={works}
                    />
                </TabsContent>

                <TabsContent
                    value="active"
                    className="space-y-4"
                >
                    <WorksList
                        filteredWorks={filterWorksByStatus(
                            "active"
                        )}
                    />
                </TabsContent>

                <TabsContent
                    value="completed"
                    className="space-y-4"
                >
                    <WorksList
                        filteredWorks={filterWorksByStatus(
                            "completed"
                        )}
                    />
                </TabsContent>

                <TabsContent
                    value="pending"
                    className="space-y-4"
                >
                    <WorksList
                        filteredWorks={filterWorksByStatus(
                            "pending"
                        )}
                    />
                </TabsContent>
            </Tabs>

            {/* Edit Modal */}
            {editingWork && (
                <EditModal
                    work={editingWork}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdate}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteWorkId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteWorkId(null);
                    }
                }}
            >
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this work?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The work will be
                            permanently removed from your works list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>

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