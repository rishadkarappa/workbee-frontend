import { WorkService } from "@/services/work-service";
import { useEffect, useState } from "react";
import { Edit, Trash2, Calendar, MapPin, Briefcase, IndianRupeeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/utils/error-helper";

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

function EditModal({ work, isOpen, onClose, onUpdate }: EditModalProps) {
    const [formData, setFormData] = useState<Work>(work);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(work);
    }, [work]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'budget' ? (value ? Number(value) : undefined) : value
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, status: value }));
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
                onUpdate(formData);
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
            <DialogContent className="max-w-full sm:max-w-4xl md:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Work</DialogTitle>
                    <DialogDescription>
                        Update your work details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="workTitle">Work Title *</Label>
                        <Input
                            id="workTitle"
                            name="workTitle"
                            value={formData.workTitle}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="workCategory">Category *</Label>
                            <Input
                                id="workCategory"
                                name="workCategory"
                                value={formData.workCategory}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workType">Type *</Label>
                            <Input
                                id="workType"
                                name="workType"
                                value={formData.workType}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={formData.endDate || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget (₹)</Label>
                            <Input
                                id="budget"
                                name="budget"
                                type="number"
                                value={formData.budget || ''}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status || 'active'} onValueChange={handleSelectChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="manualAddress">Address</Label>
                        <Input
                            id="manualAddress"
                            name="manualAddress"
                            value={formData.manualAddress || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark</Label>
                        <Input
                            id="landmark"
                            name="landmark"
                            value={formData.landmark || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Update Work'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Reusable Work Card Component
interface WorkCardProps {
    work: Work;
    onEdit: (work: Work) => void;
    onDelete: (workId: string) => void;
    getStatusColor: (status?: string) => string;
}

function WorkCard({ work, onEdit, onDelete, getStatusColor }: WorkCardProps) {
    return (
        <Card className="w-full h-auto">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl">{work.workTitle}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2 mt-2">
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

            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {work.startDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Start:</span>
                            <span>{new Date(work.startDate).toLocaleDateString()}</span>
                        </div>
                    )}

                    {work.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">End:</span>
                            <span>{new Date(work.endDate).toLocaleDateString()}</span>
                        </div>
                    )}

                    {work.budget && (
                        <div className="flex items-center gap-2 text-sm">
                            <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="font-semibold">₹{work.budget}</span>
                        </div>
                    )}
                </div>

                {(work.description || work.manualAddress || work.landmark) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {work.description && (
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-sm text-muted-foreground">{work.description}</p>
                            </div>
                        )}

                        {(work.manualAddress || work.landmark) && (
                            <div className="space-y-2">
                                {work.manualAddress && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground">Address: </span>
                                            <span>{work.manualAddress}</span>
                                        </div>
                                    </div>
                                )}
                                {work.landmark && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground">Landmark: </span>
                                            <span>{work.landmark}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <Separator className="my-2" />

                <div className="flex gap-2 pt-1">
                    <Button variant="outline" onClick={() => onEdit(work)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button onClick={() => onDelete(work.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function WorkContent() {
    const [works, setWorksData] = useState<Work[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingWork, setEditingWork] = useState<Work | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getAllWorks = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await WorkService.getMyWorks();

            if (res.data.success) {
                setWorksData(res.data.data.works || []);
            } else {
                setError('Error while fetching works data');
            }
        } catch (error) {
            console.error('Error fetching works:', error);
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
        setWorksData(prevWorks =>
            prevWorks.map(work =>
                work.id === updatedWork.id ? updatedWork : work
            )
        );
    };

    const handleDelete = async (workId: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this work?");
        if (!confirmDelete) return;

        try {
            const res = await WorkService.deleteMyWork(workId);

            if (res.data.success) {
                alert("Deleted successfully");
                setWorksData(prev => prev.filter(work => work.id !== workId));
            } else {
                alert("Error while deleting work");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert(getErrorMessage(error));
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'completed':
                return 'border-green-200 bg-green-50 text-green-700';
            case 'active':
                return 'border-blue-200 bg-blue-50 text-blue-700';
            case 'pending':
                return 'border-yellow-200 bg-yellow-50 text-yellow-700';
            case 'cancelled':
                return 'border-red-200 bg-red-50 text-red-700';
            default:
                return 'border-gray-200 bg-gray-50 text-gray-700';
        }
    };

    // Filter works by status
    const filterWorksByStatus = (status?: string) => {
        if (!status) return works;
        return works.filter(work => work.status === status);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading your works...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600">
                {error}
            </div>
        );
    }

    if (!works || works.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Works</h1>
                    <p className="text-muted-foreground mt-2">
                        No works found. Start by posting your first work!
                    </p>
                </div>
            </div>
        );
    }

    // Reusable Works List Component
    const WorksList = ({ filteredWorks }: { filteredWorks: Work[] }) => (
        <div className="grid gap-4 w-full">
            {filteredWorks.length > 0 ? (
                filteredWorks.map((work) => (
                    <WorkCard
                        key={work.id}
                        work={work}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getStatusColor={getStatusColor}
                    />
                ))
            ) : (
                <p className="text-muted-foreground text-center py-8">No works found.</p>
            )}
        </div>
    );

    return (
        <div className="space-y-6 w-full">
            {/* <div>
                <h1 className="text-3xl font-bold tracking-tight">My Works</h1>
                <p className="text-muted-foreground mt-2">
                    Total Works: {works.length}
                </p>
            </div> */}

            <Tabs defaultValue="all" className="space-y-6 w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Works</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <WorksList filteredWorks={works} />
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                    <WorksList filteredWorks={filterWorksByStatus('active')} />
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    <WorksList filteredWorks={filterWorksByStatus('completed')} />
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    <WorksList filteredWorks={filterWorksByStatus('pending')} />
                </TabsContent>
            </Tabs>

            {editingWork && (
                <EditModal
                    work={editingWork}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
