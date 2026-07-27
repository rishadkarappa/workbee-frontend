import { useState, useEffect } from "react"
import { Eye, X, Search, BookmarkIcon } from "lucide-react"
import { WorkService } from "@/services/work-service"
import { Toggle } from "../ui/toggle"
import { getErrorMessage } from "@/utils/error-helper"

// Types
interface Applier {
  _id?: string
  id?: string
  name: string
  email: string
  phone: string
  location: string
  workType: string
  preferredWorks: string[]
  confirmations: {
    reliable: boolean
    honest: boolean
    termsAccepted: boolean
  }
  rejectionReason:string
  rejectedAt:Date
  status: string
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

// Modal Component

const Modal = ({
  isOpen,
  onClose,
  applier,
  onRefresh,
}: {
  isOpen: boolean
  onClose: () => void
  applier: Applier | null
  onRefresh: () => void
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !applier) return null

  const approveWorker = async () => {
    try {
      setIsSubmitting(true)
      const res = await WorkService.approveWorkerApplication({
        workerId: applier.id || applier._id,
        status: "approved"
      })
      if (res.data.success) {
        alert('✅ Worker approved successfully! Approval email sent.')
        onClose()
        onRefresh()
      }
    } catch (error) {
      console.error('Error approving worker:', error)
      alert('❌ ' + (getErrorMessage(error) || 'Error approving worker'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('⚠️ Please provide a reason for rejection')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await WorkService.approveWorkerApplication({
        workerId: applier.id || applier._id,
        status: "rejected",
        rejectionReason: rejectionReason.trim()
      })
      if (res.data.success) {
        alert('✅ Worker application rejected. Notification email sent.')
        setShowRejectModal(false)
        setRejectionReason("")
        onClose()
        onRefresh()
      }
    } catch (error) {
      console.error('Error rejecting worker:', error)
      alert('❌ ' + (getErrorMessage || 'Error rejecting worker'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectCancel = () => {
    setShowRejectModal(false)
    setRejectionReason("")
  }

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{applier.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Worker application</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Show rejection info if rejected */}
            {applier.status === "rejected" && applier.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Previously Rejected</h4>
                <p className="text-sm text-red-700">
                  <strong>Reason:</strong> {applier.rejectionReason}
                </p>
                {applier.rejectedAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Rejected on: {new Date(applier.rejectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

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

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Confirmations
              </label>
              <div className="space-y-2">
                {Object.entries(applier.confirmations).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        value ? "bg-black" : "bg-gray-300"
                      }`}
                    >
                      {value && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 flex items-center justify-between">
            <div>
              <h6 className="text-sm font-medium text-gray-800">
                Review Application
              </h6>
              <p className="text-xs text-gray-500">
                Approve or reject this worker application
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={approveWorker}
                disabled={isSubmitting || applier.status === "approved"}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                {applier.status === "approved" ? "✓ Approved" : "Approve"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRejectClick}
                disabled={isSubmitting}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={handleRejectCancel} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Application</h3>
              <button
                onClick={handleRejectCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-black-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black-500 resize-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                💡 The worker will receive this reason via email and can reapply after addressing your concerns.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleRejectCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
               variant="outline"
                onClick={handleRejectSubmit}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
              >
                {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Main Component
export default function NewAppliers() {
  const [appliers, setAppliers] = useState<Applier[]>([])
  const [totalAppliers, setTotalAppliers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedApplier, setSelectedApplier] = useState<Applier | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
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

  // Reset to first page when debounced search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  // Fetch appliers with server-side pagination and search
  const getNewAppliers = async () => {
    try {
      setLoading(true)
      const response = await WorkService.getAppliers(
        currentPage,
        itemsPerPage,
        debouncedSearch
      )

      if (response.data.success) {
        const data = response.data.data
        setAppliers(data.workers || [])
        setTotalAppliers(data.total || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (error) {
      console.error("Error fetching new appliers:", error)
      alert("Error while fetching new appliers")
    } finally {
      setLoading(false)
    }
  }

  // Fetch appliers when page or debounced search changes
  useEffect(() => {
    getNewAppliers()
  }, [currentPage, debouncedSearch])

  const handleViewDetails = (applier: Applier) => {
    setSelectedApplier(applier)
    setIsModalOpen(true)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  if (loading && appliers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
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
            {searchTerm && (
              <Button
                variant="ghost"
                onClick={() => setSearchTerm("")}
                size="sm"
              >
                Reset
              </Button>
            )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading && appliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : appliers.length > 0 ? (
                  appliers.map((applier) => (
                    <tr key={applier.id || applier._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {applier.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{applier.email}</td>
                      <td className="px-6 py-4 text-gray-600">{applier.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                            ${
                              applier.status === "approved"
                                ? "bg-green-100/80 text-green-700 border border-green-200"
                                : applier.status === "rejected"
                                ? "bg-red-100/80 text-red-700 border border-red-200"
                                : "bg-yellow-100/80 text-yellow-700 border border-yellow-200"
                            }
                          `}
                        >
                          <span
                            className={`
                              w-1.5 h-1.5 rounded-full
                              ${
                                applier.status === "approved"
                                  ? "bg-green-500"
                                  : applier.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }
                            `}
                          />
                          {applier.status === "approved"
                            ? "Approved"
                            : applier.status === "rejected"
                            ? "Rejected"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(applier)}
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
                      No appliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalAppliers > 0 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalAppliers)} of{" "}
                {totalAppliers} appliers
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
        onRefresh={getNewAppliers}
      />
    </div>
  )
}