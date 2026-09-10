import { useState, useEffect, useCallback } from "react"
import { Eye, X, Search, MapPin, Calendar, Clock, Filter, IndianRupee } from "lucide-react"
import { WorkService } from "@/services/work-service"
import { useDebounce } from "@/hooks/useDebounce"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { ChatService } from "@/services/chat-service"
import { AuthHelper } from "@/utils/auth-helper"

// find current location through geocode
const getPlaceFromCoordinates = async (longitude: number, latitude: number): Promise<string> => {
  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json`,
      {
        params: {
          q: `${latitude},${longitude}`,
          key: import.meta.env.VITE_OPENCAGE_API_KEY,
          language: "en",
        },
      }
    )

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0]
      const components = result.components

      const city = components.city || components.town || components.village || components.county
      const state = components.state
      const country = components.country

      if (city && state) {
        return `${city}, ${state}`
      } else if (city) {
        return `${city}, ${country}`
      }

      return result.formatted?.split(',').slice(0, 2).join(',') || 'Location available'
    }

    return 'Unknown location'
  } catch (error) {
    console.error('Error fetching place name:', error)
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
}

// Types
interface Location {
  type: "Point"
  coordinates: [number, number]
}

interface WorkFilters {
  search: string
  status: string
  page: number
  limit: number
  latitude?: number
  longitude?: number
  maxDistance?: number
}

interface Work {
  id?: string
  userId: string
  workTitle: string
  workCategory: string
  workType: 'oneDay' | 'multipleDay'
  date?: string
  startDate?: string
  endDate?: string
  time: string
  description: string
  voiceFile?: string
  videoFile?: string
  duration?: string
  budget?: string
  location?: Location
  currentLocation?: string
  manualAddress?: string
  landmark?: string
  place?: string
  contactNumber: string
  userName?: string
  beforeImage?: string
  petrolAllowance?: string
  extraRequirements?: string
  anythingElse?: string
  termsAccepted: boolean
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  createdAt?: Date
  updatedAt?: Date
}

interface PaginationInfo {
  total: number
  totalPages: number
  currentPage: number
  limit: number
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
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-accent text-foreground",
    ghost: "hover:bg-accent text-foreground",
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
      className={`flex h-10 w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  )
}

const Badge = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
}) => {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

const Select = ({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`flex h-10 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </select>
  )
}

// Helper functions
const getStatusVariant = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
  switch (status) {
    case 'pending': return 'default'
    case 'assigned': return 'info'
    case 'in-progress': return 'default'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'default'
  }
}

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Modal Component work details modal
const WorkDetailsModal = ({
  isOpen,
  onClose,
  work,
  placeName,
  distance,
}: {
  isOpen: boolean
  onClose: () => void
  work: Work | null
  placeName?: string
  distance?: number | null
}) => {
  const navigate = useNavigate();

  if (!isOpen || !work) return null

  const handleChatWithClient = async () => {
    try {
      // Create or get existing chat with this client
      const response = await ChatService.createChat({
        userId: work.userId,
        workerId: AuthHelper.getUserId()!
      });

      const chat = response.data.data;

      // Navigate to messages page with chat data and work context
      navigate('/worker/worker-dashboard/client-messages', {
        state: {
          chatId: chat.id,
          userId: work.userId,
          workId: work.id,
          workTitle: work.workTitle,
          userName: work.userName || 'Client',
          currentAmount: work.budget
        }
      });

      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{work.workTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">{work.workCategory}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Work Type</label>
              <p className="mt-1">
                <Badge variant="default">
                  {work.workType === 'oneDay' ? 'One Day Work' : 'Multiple Day Work'}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="mt-1">
                <Badge variant={getStatusVariant(work.status)}>
                  {work.status.toUpperCase()}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {work.workType === 'oneDay' ? 'Date' : 'Start Date'}
              </label>
              <p className="mt-1 text-sm text-foreground">
                {work.workType === 'oneDay' ? formatDate(work.date) : formatDate(work.startDate)}
              </p>
            </div>
            {work.workType === 'multipleDay' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <p className="mt-1 text-sm text-foreground">{formatDate(work.endDate)}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time
              </label>
              <p className="mt-1 text-sm text-foreground">{work.time}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <p className="mt-1 text-sm text-foreground">{work.duration || 'Not specified'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-border pt-4">
            <label className="text-m font-medium text-foreground">Description</label>
            <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{work.description}</p>
          </div>

          {/* Budget & Payment */}
          <div className="border-t border-border pt-4">
            <h3 className="text-m font-medium text-foreground mb-3 flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              Budget & Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Budget</label>
                <p className="mt-1 text-sm font-medium text-foreground">
                  ₹{work.budget || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Travel Allowance</label>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {work.petrolAllowance ? `₹${work.petrolAllowance}` : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border-t border-border pt-4">
            <h3 className="text-m font-medium text-foreground mb-3 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location Details
            </h3>
            <div className="space-y-3">
              {work.location?.coordinates && (
                <div>
                  <label className="text-sm text-muted-foreground">Map Location</label>
                  <p className="mt-1 text-sm text-foreground">
                    {placeName || 'Loading location...'}
                  </p>
                  {distance !== null && distance !== undefined && (
                    <p className="mt-1 text-sm text-foreground font-medium">
                      Distance : {distance.toFixed(1)} km away from you
                    </p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${work.location.coordinates[1]},${work.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <MapPin className="w-3 h-3" />
                    View on Google Maps
                  </a>

                </div>
              )}
              {work.manualAddress && (
                <div>
                  <label className="text-sm text-muted-foreground">Address</label>
                  <p className="mt-1 text-sm text-foreground">{work.manualAddress}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {work.landmark && (
                  <div>
                    <label className="text-sm text-muted-foreground">Landmark</label>
                    <p className="mt-1 text-sm text-foreground">{work.landmark}</p>
                  </div>
                )}
                {work.place && (
                  <div>
                    <label className="text-sm text-muted-foreground">Place Type</label>
                    <p className="mt-1 text-sm text-foreground">{work.place}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-border pt-4">
            <label className="text-m font-medium text-foreground">Contact Number</label>
            <p className="mt-1 text-sm text-foreground">{work.contactNumber}</p>
          </div>

          {/* Additional Requirements */}
          {(work.extraRequirements || work.anythingElse) && (
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-m font-medium text-foreground">Additional Information</h3>
              {work.extraRequirements && (
                <div>
                  <label className="text-sm text-muted-foreground">Extra Requirements</label>
                  <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                    {work.extraRequirements}
                  </p>
                </div>
              )}
              {work.anythingElse && (
                <div>
                  <label className="text-sm text-muted-foreground">Additional Notes</label>
                  <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                    {work.anythingElse}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Media Files */}
          {(work.beforeImage || work.voiceFile || work.videoFile) && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {work.beforeImage && (
                  <a
                    href={`http://localhost:4002/${work.beforeImage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    📷 View Image
                  </a>
                )}
                {work.voiceFile && (
                  <a
                    href={`http://localhost:4002/${work.voiceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    🎤 Listen Voice Note
                  </a>
                )}
                {work.videoFile && (
                  <a
                    href={`http://localhost:4002/${work.videoFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    🎥 Watch Video
                  </a>
                )}
              </div>
            </div>
          )}


          {/* Timestamps */}
          <div className="border-t border-border pt-4">
            <label className="text-m font-medium text-foreground">Post Details </label>
            <div className="grid mt-4 mb-4 grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Posted:</span> {formatDate(work.createdAt)}
              </div>
              <div>
                <span className="font-medium text-foreground">Last Updated:</span> {formatDate(work.updatedAt)}
              </div>
            </div>
          </div>


        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3 z-10">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline">Make an Offer</Button>
          <Button variant="outline" onClick={handleChatWithClient}>Chat with Client</Button>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function WorkerWorksTable() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [distanceFilter, setDistanceFilter] = useState<string>("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({})
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  })

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Calculate distance using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371 // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting user location:", error)
        }
      )
    }
  }, [])

  // Fetch works with backend pagination and search
  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);

      const filters: WorkFilters = {
        search: debouncedSearchTerm,
        status: statusFilter,
        page: currentPage,
        limit: itemsPerPage,
      };

      if (distanceFilter !== "all" && userLocation) {
        const distanceMap: Record<string, number> = {
          "2km": 2,
          "5km": 5,
          "8km": 8,
          "10km": 10,
          "15km": 15,
          "20km": 20,
          "30km": 30,
          "50km": 50,
        };

        filters.latitude = userLocation.lat;
        filters.longitude = userLocation.lng;
        filters.maxDistance = distanceMap[distanceFilter];
      }

      const response = await WorkService.getAllWorks(filters);

      if (response.data.success) {
        const worksData = response.data.data.works
        const paginationData = response.data.data.pagination

        const worksArray = Array.isArray(worksData) ? worksData : []
        setWorks(worksArray)

        // Set pagination info
        if (paginationData) {
          setPagination({
            total: paginationData.total,
            totalPages: paginationData.totalPages,
            currentPage: paginationData.currentPage,
            limit: paginationData.limit
          })
        }

        // Fetch place names
        setLoadingPlaces(true)
        const placePromises = worksArray.map(async (work: Work) => {
          if (work.location?.coordinates && work.location.coordinates.length === 2) {
            const [longitude, latitude] = work.location.coordinates
            if (longitude && latitude) {
              const placeName = await getPlaceFromCoordinates(longitude, latitude)
              return { id: work.id!, placeName }
            }
          }
          return {
            id: work.id!,
            placeName: work.place || work.manualAddress || work.currentLocation || 'Not specified'
          }
        })

        const places = await Promise.all(placePromises)
        const placeMap = places.reduce((acc, { id, placeName }) => {
          if (id) acc[id] = placeName
          return acc
        }, {} as Record<string, string>)

        setPlaceNames(placeMap)
        setLoadingPlaces(false)
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchTerm,
    statusFilter,
    currentPage,
    itemsPerPage,
    distanceFilter,
    userLocation,
  ]);
  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);


  // Reset to page 1 when search or status changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, statusFilter, distanceFilter])

  const handleViewDetails = (work: Work) => {
    setSelectedWork(work)
    setIsModalOpen(true)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const totalPages = pagination.totalPages

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (loading && works.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading available works...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">

        {/* <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Works</h1>
          <p className="text-sm text-gray-600 mt-1">
            Browse and apply for works near you
            {userLocation && (
              <span className="ml-2 flex mt-7 text-black font-medium">
                <LocateIcon/>Your location detected
              </span>
            )}
          </p>
        </div> */}

        <div className="bg-card rounded-lg shadow">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by title, category, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {loading && searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Distance Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                className="w-44"
                disabled={!userLocation}
              >
                <option value="all">All Distances</option>
                <option value="2km">Within 2 km</option>
                <option value="5km">Within 5 km</option>
                <option value="8km">Within 8 km</option>
                <option value="10km">Within 10 km</option>
                <option value="15km">Within 15 km</option>
                <option value="20km">Within 20 km</option>
                <option value="30km">Within 30 km</option>
                <option value="50km">Within 50 km</option>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Work Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Location
                      </th>
                      {userLocation && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Distance
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-card divide-y divide-border">
                    {works.length > 0 ? (
                      works.map((work) => {
                        let distance: number | null = null
                        if (userLocation && work.location?.coordinates) {
                          const [workLng, workLat] = work.location.coordinates
                          distance = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            workLat,
                            workLng
                          )
                        }

                        return (
                          <tr key={work.id} className="hover:bg-accent transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground">{work.workTitle}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(work.date || work.startDate)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">
                                  {loadingPlaces ? (
                                    <span className="text-muted-foreground">Loading...</span>
                                  ) : (
                                    placeNames[work.id!] || 'Not specified'
                                  )}
                                </span>
                              </div>
                            </td>
                            {userLocation && (
                              <td className="px-6 py-4">
                                <span className="text-sm text-foreground font-medium">
                                  {distance !== null ? `${distance.toFixed(1)} km` : 'N/A'}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4 text-foreground font-medium">
                              {work.budget ? `₹${work.budget}` : 'Not specified'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={getStatusVariant(work.status)}>
                                {work.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(work)}
                                className="inline-flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={userLocation ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">
                          {distanceFilter !== "all" && !userLocation
                            ? "Please enable location to filter by distance"
                            : "No works found matching your filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-1 text-muted-foreground">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            disabled={loading}
                            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === page
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-foreground hover:bg-accent border border-border'
                              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <WorkDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        work={selectedWork}
        placeName={selectedWork?.id ? placeNames[selectedWork.id] : undefined}
        distance={
          selectedWork && userLocation && selectedWork.location?.coordinates
            ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              selectedWork.location.coordinates[1],
              selectedWork.location.coordinates[0]
            )
            : null
        }
      />
    </div>
  )
}