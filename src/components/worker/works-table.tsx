import { useState, useEffect } from "react"
import { Eye, X, Search, MapPin, Calendar, Clock, Filter, IndianRupee, LocateIcon } from "lucide-react"
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
  userName?:string
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
  variant?: "default" | "success" | "warning" | "danger" | "info"
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
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
      className={`flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
          currentAmount : work.budget
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{work.workTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">{work.workCategory}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Work Type</label>
              <p className="mt-1">
                <Badge variant="default">
                  {work.workType === 'oneDay' ? 'One Day Work' : 'Multiple Day Work'}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1">
                <Badge variant={getStatusVariant(work.status)}>
                  {work.status.toUpperCase()}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {work.workType === 'oneDay' ? 'Date' : 'Start Date'}
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {work.workType === 'oneDay' ? formatDate(work.date) : formatDate(work.startDate)}
              </p>
            </div>
            {work.workType === 'multipleDay' && (
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(work.endDate)}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time
              </label>
              <p className="mt-1 text-sm text-gray-900">{work.time}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Duration</label>
              <p className="mt-1 text-sm text-gray-900">{work.duration || 'Not specified'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="border-t pt-4">
            <label className="text-m font-medium text-black">Description</label>
            <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{work.description}</p>
          </div>

          {/* Budget & Payment */}
          <div className="border-t pt-4">
            <h3 className="text-m font-medium text-black mb-3 flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              Budget & Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Budget</label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ₹{work.budget || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Travel Allowance</label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {work.petrolAllowance ? `₹${work.petrolAllowance}` : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border-t pt-4">
            <h3 className="text-m font-medium text-black mb-3 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location Details
            </h3>
            <div className="space-y-3">
              {work.location?.coordinates && (
                <div>
                  <label className="text-sm text-gray-600">Map Location</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {placeName || 'Loading location...'}
                  </p>
                  {distance !== null && distance !== undefined && (
                    <p className="mt-1 text-sm text-black-600 font-medium">
                      Distance : {distance.toFixed(1)} km away from you
                    </p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${work.location.coordinates[1]},${work.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <MapPin className="w-3 h-3" />
                    View on Google Maps
                  </a>

                </div>
              )}
              {work.manualAddress && (
                <div>
                  <label className="text-sm text-gray-600">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{work.manualAddress}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {work.landmark && (
                  <div>
                    <label className="text-sm text-gray-600">Landmark</label>
                    <p className="mt-1 text-sm text-gray-900">{work.landmark}</p>
                  </div>
                )}
                {work.place && (
                  <div>
                    <label className="text-sm text-gray-600">Place Type</label>
                    <p className="mt-1 text-sm text-gray-900">{work.place}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t pt-4">
            <label className="text-m font-medium text-black">Contact Number</label>
            <p className="mt-1 text-sm text-gray-900">{work.contactNumber}</p>
          </div>

          {/* Additional Requirements */}
          {(work.extraRequirements || work.anythingElse) && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-m font-medium text-black">Additional Information</h3>
              {work.extraRequirements && (
                <div>
                  <label className="text-sm text-gray-600">Extra Requirements</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {work.extraRequirements}
                  </p>
                </div>
              )}
              {work.anythingElse && (
                <div>
                  <label className="text-sm text-gray-600">Additional Notes</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {work.anythingElse}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Media Files */}
          {(work.beforeImage || work.voiceFile || work.videoFile) && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {work.beforeImage && (
                  <a
                    href={`http://localhost:4002/${work.beforeImage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    📷 View Image
                  </a>
                )}
                {work.voiceFile && (
                  <a
                    href={`http://localhost:4002/${work.voiceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🎤 Listen Voice Note
                  </a>
                )}
                {work.videoFile && (
                  <a
                    href={`http://localhost:4002/${work.videoFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🎥 Watch Video
                  </a>
                )}
              </div>
            </div>
          )}


          {/* Timestamps */}
          <div className="border-t pt-4">
            <label className="text-m font-medium text-black">Post Details </label>
            <div className="grid mt-4 mb-4 grid-cols-1 md:grid-cols-2 gap-4 text-xs text-black">
              <div>
                <span className="font-medium">Posted:</span> {formatDate(work.createdAt)}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {formatDate(work.updatedAt)}
              </div>
            </div>
          </div>


        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 z-10">
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
  const fetchWorks = async () => {
    try {
      setLoading(true)

      // Prepare filters
      const filters: any = {
        search: debouncedSearchTerm,
        status: statusFilter,
        page: currentPage,
        limit: itemsPerPage
      }

      // Add geospatial filters if distance filter is active
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
        }

        filters.latitude = userLocation.lat
        filters.longitude = userLocation.lng
        filters.maxDistance = distanceMap[distanceFilter]
      }

      const response = await WorkService.getAllWorks(filters)

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
      console.error("Error fetching works:", error)
      alert("Error while fetching works")
    } finally {
      setLoading(false)
    }
  }

  // Fetch works when filters change
  useEffect(() => {
    fetchWorks()
  }, [debouncedSearchTerm, statusFilter, currentPage, distanceFilter])

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available works...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by title, category, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {loading && searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-black-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Distance Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
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
              <Filter className="w-4 h-4 text-gray-400" />
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
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Work Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      {userLocation && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Distance
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
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
                          <tr key={work.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{work.workTitle}</div>
                              <div className="text-sm text-gray-500">{formatDate(work.date || work.startDate)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600">
                                  {loadingPlaces ? (
                                    <span className="text-gray-400">Loading...</span>
                                  ) : (
                                    placeNames[work.id!] || 'Not specified'
                                  )}
                                </span>
                              </div>
                            </td>
                            {userLocation && (
                              <td className="px-6 py-4">
                                <span className="text-sm text-black font-medium">
                                  {distance !== null ? `${distance.toFixed(1)} km` : 'N/A'}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4 text-gray-900 font-medium">
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
                        <td colSpan={userLocation ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
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
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-600">
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
                          <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            disabled={loading}
                            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === page
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border'
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
