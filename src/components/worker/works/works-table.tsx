import { useState, useEffect, useCallback } from "react"
import {
  Eye,
  Search,
  MapPin,
  Filter,
} from "lucide-react"
import { WorkService } from "@/services/work-service"
import { useDebounce } from "@/hooks/useDebounce"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { BadgeProps, PaginationInfo, SelectProps, Work, WorkFilters } from "./types/types"
import WorkDetailsModal from "./modals/WorkDetailsModal"

// GEOLOCATION
const getPlaceFromCoordinates = async (
  longitude: number,
  latitude: number
): Promise<string> => {
  try {
    const response = await axios.get(
      "https://api.opencagedata.com/geocode/v1/json",
      {
        params: {
          q: `${latitude},${longitude}`,
          key: import.meta.env.VITE_OPENCAGE_API_KEY,
          language: "en",
        },
      }
    )

    if (
      response.data.results &&
      response.data.results.length > 0
    ) {
      const result = response.data.results[0]
      const components = result.components

      const city =
        components.city ||
        components.town ||
        components.village ||
        components.county

      const state = components.state
      const country = components.country

      if (city && state) {
        return `${city}, ${state}`
      }

      if (city) {
        return `${city}, ${country}`
      }

      return (
        result.formatted?.split(",").slice(0, 2).join(",") ||
        "Location available"
      )
    }

    return "Unknown location"
  } catch (error) {
    console.error("Error fetching place name:", error)

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
}


const Badge = ({
  children,
  variant = "default",
}: BadgeProps) => {
  const variants = {
    default:
      "bg-muted text-muted-foreground",

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


const Select = ({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
}: SelectProps) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        flex h-10
        rounded-md
        border border-border
        bg-background
        text-foreground
        px-3 py-2
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-ring
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </select>
  )
}

// HELPERS
const getStatusVariant = (
  status: string
): "default" | "success" | "warning" | "danger" | "info" => {
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

// WORK DETAILS MODAL


// MAIN COMPONENT

export default function WorkerWorksTable() {

  const [works, setWorks] = useState<Work[]>([])

  const [loading, setLoading] =
    useState(true)

  const [selectedWork, setSelectedWork] =
    useState<Work | null>(null)

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [searchTerm, setSearchTerm] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState("all")

  const [distanceFilter, setDistanceFilter] =
    useState("all")

  const [userLocation, setUserLocation] =
    useState<{
      lat: number
      lng: number
    } | null>(null)

  const [currentPage, setCurrentPage] =
    useState(1)

  const [itemsPerPage] =
    useState(10)

  const [placeNames, setPlaceNames] =
    useState<Record<string, string>>({})

  const [loadingPlaces, setLoadingPlaces] =
    useState(false)

  const [pagination, setPagination] =
    useState<PaginationInfo>({
      total: 0,
      totalPages: 0,
      currentPage: 1,
      limit: 10,
    })

  // DEBOUNCED SEARCH

  const debouncedSearchTerm =
    useDebounce(searchTerm, 500)

  // CALCULATE DISTANCE

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {

    const R = 6371

    const dLat =
      (lat2 - lat1) *
      (Math.PI / 180)

    const dLon =
      (lon2 - lon1) *
      (Math.PI / 180)

    const a =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
      Math.cos(
        lat1 * (Math.PI / 180)
      ) *
      Math.cos(
        lat2 * (Math.PI / 180)
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      )

    return R * c
  }

  // GET USER LOCATION

  useEffect(() => {

    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {

        setUserLocation({
          lat:
            position.coords.latitude,

          lng:
            position.coords.longitude,
        })
      },

      (error) => {
        console.error(
          "Error getting user location:",
          error
        )
      }
    )

  }, [])

  // FETCH WORKS

  const fetchWorks = useCallback(
    async () => {

      try {

        setLoading(true)

        const filters: WorkFilters = {
          search: debouncedSearchTerm,
          status: statusFilter,
          page: currentPage,
          limit: itemsPerPage,
        }

        // DISTANCE FILTER

        if (
          distanceFilter !== "all" &&
          userLocation
        ) {

          const distanceMap: Record<
            string,
            number
          > = {
            "2km": 2,
            "5km": 5,
            "8km": 8,
            "10km": 10,
            "15km": 15,
            "20km": 20,
            "30km": 30,
            "50km": 50,
          }

          filters.latitude =
            userLocation.lat

          filters.longitude =
            userLocation.lng

          filters.maxDistance =
            distanceMap[
            distanceFilter
            ]
        }

        // API CALL

        const response =
          await WorkService.getAllWorks(
            filters
          )

        if (response.data.success) {

          const worksData =
            response.data.data.works

          const paginationData =
            response.data.data.pagination

          const worksArray =
            Array.isArray(worksData)
              ? worksData
              : []

          setWorks(worksArray)

          // PAGINATION

          if (paginationData) {

            setPagination({
              total:
                paginationData.total,

              totalPages:
                paginationData.totalPages,

              currentPage:
                paginationData.currentPage,

              limit:
                paginationData.limit,
            })
          }

          // PLACE NAMES

          setLoadingPlaces(true)

          const placePromises =
            worksArray.map(
              async (work: Work) => {

                if (
                  work.location?.coordinates &&
                  work.location.coordinates
                    .length === 2
                ) {

                  const [
                    longitude,
                    latitude,
                  ] =
                    work.location.coordinates

                  if (
                    longitude !== undefined &&
                    latitude !== undefined
                  ) {

                    const placeName =
                      await getPlaceFromCoordinates(
                        longitude,
                        latitude
                      )

                    return {
                      id: work.id,
                      placeName,
                    }
                  }
                }

                return {
                  id: work.id,

                  placeName:
                    work.place ||
                    work.manualAddress ||
                    work.currentLocation ||
                    "Not specified",
                }
              }
            )

          const places =
            await Promise.all(
              placePromises
            )

          const placeMap =
            places.reduce(
              (
                acc,
                {
                  id,
                  placeName,
                }
              ) => {

                if (id) {
                  acc[id] =
                    placeName
                }

                return acc

              },
              {} as Record<
                string,
                string
              >
            )

          setPlaceNames(placeMap)

          setLoadingPlaces(false)
        }

      } catch (error) {

        console.error(
          "Error fetching works:",
          error
        )

        setLoadingPlaces(false)

      } finally {

        setLoading(false)
      }

    },
    [
      debouncedSearchTerm,
      statusFilter,
      currentPage,
      itemsPerPage,
      distanceFilter,
      userLocation,
    ]
  )

  // FETCH EFFECT

  useEffect(() => {
    fetchWorks()
  }, [fetchWorks])

  // RESET PAGE WHEN FILTER CHANGES

  useEffect(() => {

    setCurrentPage(1)

  }, [
    debouncedSearchTerm,
    statusFilter,
    distanceFilter,
  ])

  // VIEW DETAILS

  const handleViewDetails = (
    work: Work
  ) => {

    setSelectedWork(work)
    setIsModalOpen(true)
  }

  // PAGE NUMBERS

  const getPageNumbers = () => {

    const pages: (
      | number
      | string
    )[] = []

    const totalPages =
      pagination.totalPages

    if (totalPages <= 7) {

      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i)
      }

    } else if (
      currentPage <= 3
    ) {

      for (
        let i = 1;
        i <= 5;
        i++
      ) {
        pages.push(i)
      }

      pages.push("...")
      pages.push(totalPages)

    } else if (
      currentPage >=
      totalPages - 2
    ) {

      pages.push(1)
      pages.push("...")

      for (
        let i =
          totalPages - 4;
        i <= totalPages;
        i++
      ) {
        pages.push(i)
      }

    } else {

      pages.push(1)
      pages.push("...")

      for (
        let i =
          currentPage - 1;
        i <= currentPage + 1;
        i++
      ) {
        pages.push(i)
      }

      pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  // INITIAL LOADING

  if (
    loading &&
    works.length === 0
  ) {

    return (
      <div
        className="
          flex
          items-center
          justify-center
          min-h-screen
          bg-background
        "
      >

        <div className="text-center">

          <div
            className="
              w-16
              h-16
              border-4
              border-primary
              border-t-transparent
              rounded-full
              animate-spin
              mx-auto
              mb-4
            "
          />

          <p className="text-muted-foreground">
            Loading available works...
          </p>

        </div>
      </div>
    )
  }

  // RENDER

  return (
    <div className="min-h-screen bg-background p-6">

      <div className="max-w-7xl mx-auto">

        <div className="bg-card rounded-lg shadow">

          {/* 
              FILTER HEADER
           */}

          <div
            className="
              p-4
              border-b border-border
              flex
              items-center
              justify-between
              flex-wrap
              gap-4
            "
          >

            {/* SEARCH */}
            <div className="relative flex-1 max-w-sm">

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-muted-foreground
                  w-4 h-4
                "
              />

              <Input
                placeholder="Search by title, category, location..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="pl-9"
              />

              {loading &&
                searchTerm && (
                  <div
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                    "
                  >
                    <div
                      className="
                        w-4
                        h-4
                        border-2
                        border-primary
                        border-t-transparent
                        rounded-full
                        animate-spin
                      "
                    />
                  </div>
                )}

            </div>

            {/* 
                DISTANCE FILTER
             */}

            <div className="flex items-center gap-2">

              <MapPin
                className="
                  w-4
                  h-4
                  text-muted-foreground
                "
              />

              <Select
                value={distanceFilter}
                onChange={(e) =>
                  setDistanceFilter(
                    e.target.value
                  )
                }
                className="w-44"
                disabled={!userLocation}
              >
                <option value="all">
                  All Distances
                </option>

                <option value="2km">
                  Within 2 km
                </option>

                <option value="5km">
                  Within 5 km
                </option>

                <option value="8km">
                  Within 8 km
                </option>

                <option value="10km">
                  Within 10 km
                </option>

                <option value="15km">
                  Within 15 km
                </option>

                <option value="20km">
                  Within 20 km
                </option>

                <option value="30km">
                  Within 30 km
                </option>

                <option value="50km">
                  Within 50 km
                </option>
              </Select>

            </div>

            {/* 
                STATUS FILTER
             */}

            <div className="flex items-center gap-2">

              <Filter
                className="
                  w-4
                  h-4
                  text-muted-foreground
                "
              />

              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="w-40"
              >

                <option value="all">
                  All Status
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="assigned">
                  Assigned
                </option>

                <option value="in-progress">
                  In Progress
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </Select>

            </div>

          </div>

          {/* 
              TABLE LOADING
           */}

          {loading ? (

            <div
              className="
                flex
                items-center
                justify-center
                py-12
              "
            >

              <div
                className="
                  w-8
                  h-8
                  border-4
                  border-primary
                  border-t-transparent
                  rounded-full
                  animate-spin
                "
              />

            </div>

          ) : (

            <>

              {/* 
                  TABLE
               */}

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead
                    className="
                      bg-muted
                      border-b border-border
                    "
                  >

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

                  <tbody
                    className="
                      bg-card
                      divide-y
                      divide-border
                    "
                  >

                    {works.length > 0 ? (

                      works.map((work) => {

                        let distance:
                          | number
                          | null = null

                        if (
                          userLocation &&
                          work.location?.coordinates
                        ) {

                          const [
                            workLng,
                            workLat,
                          ] =
                            work.location
                              .coordinates

                          distance =
                            calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              workLat,
                              workLng
                            )
                        }

                        return (
                          <tr
                            key={work.id}
                            className="
                              hover:bg-accent
                              transition-colors
                            "
                          >

                            {/* WORK TITLE */}
                            <td className="px-6 py-4">

                              <div className="font-medium text-foreground">
                                {work.workTitle}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {formatDate(
                                  work.date ||
                                  work.startDate
                                )}
                              </div>

                            </td>

                            {/* LOCATION */}
                            <td className="px-6 py-4">

                              <div className="flex items-start gap-1.5">

                                <MapPin
                                  className="
                                    w-4
                                    h-4
                                    text-muted-foreground
                                    flex-shrink-0
                                    mt-0.5
                                  "
                                />

                                <span className="text-sm text-muted-foreground">

                                  {loadingPlaces ? (

                                    <span>
                                      Loading...
                                    </span>

                                  ) : (

                                    placeNames[
                                    work.id || ""
                                    ] ||
                                    "Not specified"
                                  )}

                                </span>

                              </div>

                            </td>

                            {/* DISTANCE */}
                            {userLocation && (
                              <td className="px-6 py-4">

                                <span
                                  className="
                                    text-sm
                                    text-foreground
                                    font-medium
                                  "
                                >
                                  {distance !==
                                    null
                                    ? `${distance.toFixed(
                                      1
                                    )} km`
                                    : "N/A"}
                                </span>

                              </td>
                            )}

                            {/* BUDGET */}
                            <td
                              className="
                                px-6
                                py-4
                                text-foreground
                                font-medium
                              "
                            >
                              {work.budget
                                ? `₹${work.budget}`
                                : "Not specified"}
                            </td>

                            {/* STATUS */}
                            <td className="px-6 py-4">

                              <Badge
                                variant={getStatusVariant(
                                  work.status
                                )}
                              >
                                {work.status}
                              </Badge>

                            </td>

                            {/* DETAILS */}
                            <td className="px-6 py-4 text-center">

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewDetails(
                                    work
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-1
                                "
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

                        <td
                          colSpan={
                            userLocation
                              ? 6
                              : 5
                          }
                          className="
                            px-6
                            py-12
                            text-center
                            text-muted-foreground
                          "
                        >

                          {distanceFilter !==
                            "all" &&
                            !userLocation
                            ? "Please enable location to filter by distance"
                            : "No works found matching your filters."}

                        </td>

                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

              {/* 
                  PAGINATION
               */}

              {pagination.totalPages >
                1 && (

                  <div
                    className="
                    px-6
                    py-4
                    border-t border-border
                    flex
                    items-center
                    justify-between
                    gap-4
                    flex-wrap
                  "
                  >

                    {/* RESULT COUNT */}
                    <div className="text-sm text-muted-foreground">

                      Showing{" "}
                      {(
                        (currentPage - 1) *
                        itemsPerPage
                      ) + 1}{" "}
                      to{" "}
                      {Math.min(
                        currentPage *
                        itemsPerPage,
                        pagination.total
                      )}{" "}
                      of{" "}
                      {pagination.total}{" "}
                      results

                    </div>

                    {/* PAGINATION BUTTONS */}
                    <div className="flex gap-2">

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            (prev) =>
                              Math.max(
                                1,
                                prev - 1
                              )
                          )
                        }
                        disabled={
                          currentPage ===
                          1 ||
                          loading
                        }
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">

                        {getPageNumbers().map(
                          (
                            page,
                            index
                          ) =>

                            page ===
                              "..." ? (

                              <span
                                key={`ellipsis-${index}`}
                                className="
                                px-3
                                py-1
                                text-muted-foreground
                              "
                              >
                                ...
                              </span>

                            ) : (

                              <button
                                key={page}
                                onClick={() =>
                                  setCurrentPage(
                                    page as number
                                  )
                                }
                                disabled={loading}
                                className={`
                                px-3
                                py-1
                                rounded
                                text-sm
                                transition-colors
                                ${currentPage ===
                                    page
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-foreground hover:bg-accent border border-border"
                                  }
                                ${loading
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                  }
                              `}
                              >
                                {page}
                              </button>

                            )
                        )}

                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            (prev) =>
                              Math.min(
                                pagination.totalPages,
                                prev + 1
                              )
                          )
                        }
                        disabled={
                          currentPage ===
                          pagination.totalPages ||
                          loading
                        }
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

      {/* 
          WORK DETAILS MODAL
       */}

      <WorkDetailsModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        work={selectedWork}
        placeName={
          selectedWork?.id
            ? placeNames[
            selectedWork.id
            ]
            : undefined
        }
        distance={
          selectedWork &&
            userLocation &&
            selectedWork.location?.coordinates
            ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              selectedWork.location
                .coordinates[1],
              selectedWork.location
                .coordinates[0]
            )
            : null
        }
      />

    </div>
  )
}
