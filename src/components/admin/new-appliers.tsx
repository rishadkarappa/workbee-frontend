import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  X,
  Search,
  Loader2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Check,
  CircleX,
} from "lucide-react";

import { WorkService } from "@/services/work-service";
import { getErrorMessage } from "@/utils/error-helper";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Types
interface Applier {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  workTypes: string[];
  preferredWorks: string[];
  confirmations: {
    reliable: boolean;
    honest: boolean;
    termsAccepted: boolean;
  };
  rejectionReason?: string;
  rejectedAt?: Date;
  status: string;
  createdAt?: Date;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// Status Badge
const ApplicationStatusBadge = ({
  status,
}: {
  status: string;
}) => {
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
      >
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400" />
        Approved
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/10 text-destructive"
      >
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        Rejected
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-400"
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400" />
      Pending
    </Badge>
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

      {value ? (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
        >
          <Check className="mr-1 h-3 w-3" />
          Yes
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          No
        </Badge>
      )}
    </div>
  );
};

// Main Worker Application Dialog
const WorkerApplicationDialog = ({
  isOpen,
  onClose,
  applier,
  onRefresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  applier: Applier | null;
  onRefresh: () => void;
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approveWorker = async () => {
    if (!applier) return;

    try {
      setIsSubmitting(true);

      const res = await WorkService.approveWorkerApplication({
        workerId: applier.id,
        status: "approved",
      });

      if (res.data.success) {
        alert("Done: Worker approved successfully! Approval email sent.");
        onClose();
        onRefresh();
      }
    } catch (error) {
      console.error("Error approving worker:", error);

      alert(
        "Error: " +
        (getErrorMessage(error) || "Error approving worker")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!applier) return;

    if (!rejectionReason.trim()) {
      alert("⚠️ Please provide a reason for rejection");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await WorkService.approveWorkerApplication({
        workerId: applier.id,
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });

      if (res.data.success) {
        alert("Worker application rejected. Notification email sent.");

        setShowRejectModal(false);
        setRejectionReason("");

        onClose();
        onRefresh();
      }
    } catch (error) {
      console.error("Error rejecting worker:", error);

      alert(
        "Error: " +
        (getErrorMessage(error) || "Error rejecting worker")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="pr-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="truncate text-xl">
                  {applier?.name}
                </DialogTitle>

                <DialogDescription className="mt-1">
                  Review worker application details and make a decision.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {applier && (
            <div className="space-y-6 py-2">
              {/* Current Status */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Application status
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Current status of this worker application
                  </p>
                </div>

                <ApplicationStatusBadge status={applier.status} />
              </div>

              {/* Previous Rejection */}
              {applier.status === "rejected" &&
                applier.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <CircleX className="h-4 w-4 text-destructive" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-destructive">
                          Previously Rejected
                        </h4>

                        <p className="mt-1 text-sm text-foreground">
                          <span className="font-medium">Reason:</span>{" "}
                          {applier.rejectionReason}
                        </p>

                        {applier.rejectedAt && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Rejected on:{" "}
                            {new Date(
                              applier.rejectedAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Personal Information */}
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Personal information
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Information provided by the worker during application.
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
                    label="Work Types"
                    value={
                      applier.workTypes?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {applier.workTypes.map((work, index) => (
                            <Badge key={`${work}-${index}`} variant="secondary">
                              {work}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No work types selected
                        </span>
                      )
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
                    Work categories selected by the applicant.
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

              <Separator />

              {/* Confirmations */}
              {/* Application Agreement */}
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Application agreement
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    The applicant confirmed the required worker agreement before
                    submitting the application.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Worker agreement accepted
                      </p>

                      <p className="text-xs text-muted-foreground">
                        All required confirmations were accepted during application.
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Accepted
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {applier && (
            <DialogFooter className="border-t pt-4">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">
                    Review application
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Approve or reject this worker application.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={approveWorker}
                    disabled={
                      isSubmitting || applier.status === "approved"
                    }
                    className="border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : applier.status === "approved" ? (
                      <Check className="h-4 w-4" />
                    ) : null}

                    {applier.status === "approved"
                      ? "Approved"
                      : "Approve"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleRejectClick}
                    disabled={isSubmitting}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <AlertDialog
        open={showRejectModal}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            handleRejectCancel();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject Application
            </AlertDialogTitle>

            <AlertDialogDescription>
              Please provide a clear reason for rejecting this worker
              application. The reason will be sent to the worker via email.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Reason for Rejection{" "}
              <span className="text-destructive">*</span>
            </Label>

            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(e.target.value)
              }
              placeholder="Please provide a clear reason for rejection."
              rows={5}
              disabled={isSubmitting}
              className="resize-none"
            />

            <p className="text-xs text-muted-foreground">
              The worker can review this reason and reapply after
              addressing your concerns.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleRejectCancel}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleRejectSubmit}
              disabled={
                isSubmitting || !rejectionReason.trim()
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {isSubmitting
                ? "Rejecting..."
                : "Confirm Rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Main Component
export default function NewAppliers() {
  const [appliers, setAppliers] = useState<Applier[]>([]);
  const [totalAppliers, setTotalAppliers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedApplier, setSelectedApplier] =
    useState<Applier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

  // Reset to page 1 whenever search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Fetch appliers
  const getNewAppliers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await WorkService.getAppliers(
        currentPage,
        itemsPerPage,
        debouncedSearch,
        statusFilter
      );

      if (response.data.success) {
        const data = response.data.data;

        setAppliers(data.workers || []);
        setTotalAppliers(data.total || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching new appliers:", error);
      alert("Error while fetching new appliers");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    getNewAppliers();
  }, [getNewAppliers]);

  const handleViewDetails = (applier: Applier) => {
    setSelectedApplier(applier);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleReset = () => {
    setSearchTerm("");
  };

  // Initial loading
  if (loading && appliers.length === 0 && !searchTerm && statusFilter === 'all') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading appliers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="w-full sm:w-fit">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 sm:flex-none">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />

              {loading && searchTerm && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <X className="mr-1 h-4 w-4" />
                Reset
              </Button>
            )}
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

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Phone
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading && appliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center"
                    >
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                    </td>
                  </tr>
                ) : appliers.length > 0 ? (
                  appliers.map((applier) => (
                    <tr
                      key={applier.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* Name */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-foreground">
                          {applier.name}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {applier.email}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {applier.phone}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <ApplicationStatusBadge
                          status={applier.status}
                        />
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewDetails(applier)
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
                          No appliers found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {searchTerm || statusFilter !== 'all'
                            ? "Try changing your search or filter."
                            : "No applications yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalAppliers > 0 && (
            <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  totalAppliers
                )}{" "}
                of {totalAppliers} appliers
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(currentPage - 1)
                  }
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>

                <span className="min-w-[110px] px-2 text-center text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(currentPage + 1)
                  }
                  disabled={
                    currentPage >= totalPages || loading
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <WorkerApplicationDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applier={selectedApplier}
        onRefresh={getNewAppliers}
      />
    </div>
  );
}