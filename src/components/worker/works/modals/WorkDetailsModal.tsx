import { useNavigate } from "react-router-dom"
import {
    X,
    MapPin,
    Calendar,
    Clock,
    IndianRupee,
    ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChatService } from "@/services/chat-service"
import { AuthHelper } from "@/utils/auth-helper"

import type { Work } from "../types/types"

interface WorkDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    work: Work | null
    placeName?: string
    distance?: number | null
}

const Badge = ({
    children,
    variant = "default",
}: {
    children: React.ReactNode
    variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
}) => {
    const variants = {
        default: "bg-muted text-muted-foreground",

        success:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",

        warning:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",

        danger:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",

        info:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    }

    return (
        <span
            className={`
        inline-flex items-center
        rounded-full
        px-2.5 py-0.5
        text-xs font-medium
        ${variants[variant]}
      `}
        >
            {children}
        </span>
    )
}

const getStatusVariant = (
    status: string
):
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info" => {
    switch (status) {
        case "pending":
            return "default"

        case "assigned":
            return "info"

        case "in-progress":
            return "default"

        case "completed":
            return "success"

        case "cancelled":
            return "danger"

        default:
            return "default"
    }
}

const formatDate = (
    dateString?: string | Date
) => {
    if (!dateString) {
        return "N/A"
    }

    return new Date(dateString).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    )
}

const WorkDetailsModal = ({
    isOpen,
    onClose,
    work,
    placeName,
    distance,
}: WorkDetailsModalProps) => {
    const navigate = useNavigate()

    if (!isOpen || !work) {
        return null
    }

    const handleChatWithClient = async () => {
        try {
            const workerId = AuthHelper.getUserId()

            if (!workerId) {
                alert("Unable to identify worker. Please login again.")
                return
            }

            const response = await ChatService.createChat({
                userId: work.userId,
                workerId,
            })

            const chat = response.data.data

            navigate("/worker/worker-dashboard/client-messages", {
                state: {
                    chatId: chat.id,
                    userId: work.userId,
                    workId: work.id,
                    workTitle: work.workTitle,
                    userName: work.userName || "Client",
                    currentAmount: work.budget,
                },
            }
            )

            onClose()
        } catch (error) {
            console.error(
                "Error creating chat:",
                error
            )

            alert(
                "Failed to start chat. Please try again."
            )
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* MODAL */}
            <div
                className="
          relative
          bg-card
          rounded-lg
          shadow-xl
          w-full
          max-w-4xl
          max-h-[90vh]
          overflow-y-auto
          m-4
        "
            >
                {/* HEADER */}
                <div
                    className="
            sticky top-0
            bg-card
            border-b border-border
            px-6 py-4
            flex items-center justify-between
            z-10
          "
                >
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {work.workTitle}
                        </h2>

                        <p className="text-sm text-muted-foreground mt-1">
                            {work.workCategory}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="
              text-muted-foreground
              hover:text-foreground
              transition-colors
            "
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="px-6 py-4 space-y-6">
                    {/* BASIC INFORMATION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* WORK TYPE */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Work Type
                            </label>

                            <p className="mt-1">
                                <Badge variant="default">
                                    {work.workType === "oneDay"
                                        ? "One Day Work"
                                        : "Multiple Day Work"}
                                </Badge>
                            </p>
                        </div>

                        {/* STATUS */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Status
                            </label>

                            <p className="mt-1">
                                <Badge
                                    variant={getStatusVariant(
                                        work.status
                                    )}
                                >
                                    {work.status.toUpperCase()}
                                </Badge>
                            </p>
                        </div>

                        {/* DATE */}
                        <div>
                            <label
                                className="
                  text-sm font-medium
                  text-muted-foreground
                  flex items-center gap-1
                "
                            >
                                <Calendar className="w-4 h-4" />

                                {work.workType === "oneDay"
                                    ? "Date"
                                    : "Start Date"}
                            </label>

                            <p className="mt-1 text-sm text-foreground">
                                {work.workType === "oneDay"
                                    ? formatDate(work.date)
                                    : formatDate(work.startDate)}
                            </p>
                        </div>

                        {/* END DATE */}
                        {work.workType === "multipleDay" && (
                            <div>
                                <label
                                    className="
                    text-sm font-medium
                    text-muted-foreground
                    flex items-center gap-1
                  "
                                >
                                    <Calendar className="w-4 h-4" />
                                    End Date
                                </label>

                                <p className="mt-1 text-sm text-foreground">
                                    {formatDate(work.endDate)}
                                </p>
                            </div>
                        )}

                        {/* TIME */}
                        <div>
                            <label
                                className="
                  text-sm font-medium
                  text-muted-foreground
                  flex items-center gap-1
                "
                            >
                                <Clock className="w-4 h-4" />
                                Time
                            </label>

                            <p className="mt-1 text-sm text-foreground">
                                {work.time}
                            </p>
                        </div>

                        {/* DURATION */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Duration
                            </label>

                            <p className="mt-1 text-sm text-foreground">
                                {work.duration || "Not specified"}
                            </p>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="border-t border-border pt-4">
                        <label className="text-sm font-medium text-foreground">
                            Description
                        </label>

                        <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                            {work.description}
                        </p>
                    </div>

                    {/* BUDGET & PAYMENT */}
                    <div className="border-t border-border pt-4">
                        <h3
                            className="
                text-sm font-medium
                text-foreground
                mb-3
                flex items-center gap-1
              "
                        >
                            <IndianRupee className="w-4 h-4" />
                            Budget & Payment
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* BUDGET */}
                            <div>
                                <label className="text-sm text-muted-foreground">
                                    Budget
                                </label>

                                <p className="mt-1 text-sm font-medium text-foreground">
                                    ₹{work.budget || "Not specified"}
                                </p>
                            </div>

                            {/* TRAVEL ALLOWANCE */}
                            <div>
                                <label className="text-sm text-muted-foreground">
                                    Travel Allowance
                                </label>

                                <p className="mt-1 text-sm font-medium text-foreground">
                                    {work.petrolAllowance
                                        ? `₹${work.petrolAllowance}`
                                        : "Not specified"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* LOCATION */}
                    <div className="border-t border-border pt-4">
                        <h3
                            className="
                text-sm font-medium
                text-foreground
                mb-3
                flex items-center gap-1
              "
                        >
                            <MapPin className="w-4 h-4" />
                            Location Details
                        </h3>

                        <div className="space-y-3">
                            {/* MAP LOCATION */}
                            {work.location?.coordinates && (
                                <div className="rounded-lg border border-border bg-muted/30 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground">
                                                Map Location
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {placeName || "Loading location..."}
                                            </p>

                                            {distance !== null &&
                                                distance !== undefined && (
                                                    <p className="mt-2 text-sm font-medium text-foreground">
                                                        Distance:{" "}
                                                        <span className="text-primary">
                                                            {distance.toFixed(1)} km
                                                        </span>{" "}
                                                        away from you
                                                    </p>
                                                )}

                                            <a
                                                href={`https://www.google.com/maps?q=${work.location.coordinates[1]},${work.location.coordinates[0]}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="
                          mt-4
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-md
                          border
                          border-border
                          bg-background
                          px-4
                          py-2.5
                          text-sm
                          font-medium
                          text-foreground
                          shadow-sm
                          transition-all
                          hover:bg-accent
                          hover:text-accent-foreground
                          hover:shadow
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-ring
                        "
                                            >
                                                <MapPin className="h-4 w-4 text-primary" />

                                                <span>
                                                    View on Google Maps
                                                </span>

                                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MANUAL ADDRESS */}
                            {work.manualAddress && (
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Address
                                    </label>

                                    <p className="mt-1 text-sm text-foreground">
                                        {work.manualAddress}
                                    </p>
                                </div>
                            )}

                            {/* LANDMARK + PLACE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {work.landmark && (
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Landmark
                                        </label>

                                        <p className="mt-1 text-sm text-foreground">
                                            {work.landmark}
                                        </p>
                                    </div>
                                )}

                                {work.place && (
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Place Type
                                        </label>

                                        <p className="mt-1 text-sm text-foreground">
                                            {work.place}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <div className="border-t border-border pt-4">
                        <label className="text-sm font-medium text-foreground">
                            Contact Number
                        </label>

                        <p className="mt-1 text-sm text-foreground">
                            {work.contactNumber}
                        </p>
                    </div>

                    {/* ADDITIONAL REQUIREMENTS */}
                    {(work.extraRequirements ||
                        work.anythingElse) && (
                            <div
                                className="
                border-t border-border
                pt-4
                space-y-3
              "
                            >
                                <h3 className="text-sm font-medium text-foreground">
                                    Additional Information
                                </h3>

                                {work.extraRequirements && (
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Extra Requirements
                                        </label>

                                        <p
                                            className="
                      mt-1
                      text-sm
                      text-foreground
                      whitespace-pre-wrap
                    "
                                        >
                                            {work.extraRequirements}
                                        </p>
                                    </div>
                                )}

                                {work.anythingElse && (
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Additional Notes
                                        </label>

                                        <p
                                            className="
                      mt-1
                      text-sm
                      text-foreground
                      whitespace-pre-wrap
                    "
                                        >
                                            {work.anythingElse}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                    {/* IMAGES */}
                    {work.images &&
                        work.images.length > 0 && (
                            <div className="border-t border-border pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                    Images
                                </h3>

                                <div className="flex flex-wrap gap-3">
                                    {work.images.map((img) => (
                                        <a
                                            key={img.publicId}
                                            href={img.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                        block
                        h-28
                        w-28
                        rounded-lg
                        overflow-hidden
                        border
                        border-border
                        hover:opacity-90
                        transition-opacity
                      "
                                        >
                                            <img
                                                src={img.url}
                                                alt="Work"
                                                className="
                          h-full
                          w-full
                          object-cover
                        "
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* VIDEOS */}
                    {work.videos &&
                        work.videos.length > 0 && (
                            <div className="border-t border-border pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                    Videos
                                </h3>

                                <div className="flex flex-wrap gap-3">
                                    {work.videos.map((vid) => (
                                        <video
                                            key={vid.publicId}
                                            src={vid.url}
                                            controls
                                            className="
                        h-40
                        w-56
                        rounded-lg
                        border
                        border-border
                        bg-black
                      "
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* VOICE NOTE */}
                    {work.voiceFile?.url && (
                        <div className="border-t border-border pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                Voice Note
                            </h3>

                            <audio
                                controls
                                src={work.voiceFile.url}
                                className="w-full max-w-md dark:[color-scheme:dark]"
                            />
                        </div>
                    )}

                    {/* TIMESTAMPS */}
                    <div className="border-t border-border pt-4">
                        <label className="text-sm font-medium text-foreground">
                            Post Details
                        </label>

                        <div
                            className="
                grid
                mt-4
                mb-4
                grid-cols-1
                md:grid-cols-2
                gap-4
                text-xs
                text-muted-foreground
              "
                        >
                            <div>
                                <span className="font-medium text-foreground">
                                    Posted:
                                </span>{" "}
                                {formatDate(work.createdAt)}
                            </div>

                            <div>
                                <span className="font-medium text-foreground">
                                    Last Updated:
                                </span>{" "}
                                {formatDate(work.updatedAt)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div
                    className="
            sticky
            bottom-0
            bg-card
            border-t border-border
            px-6 py-4
            flex
            justify-end
            gap-3
            z-10
          "
                >
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Close
                    </Button>

                    <Button variant="outline">
                        Make an Offer
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleChatWithClient}
                    >
                        Chat with Client
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default WorkDetailsModal