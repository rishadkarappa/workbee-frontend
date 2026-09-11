import type { ChangeEvent, ReactNode } from "react"

// TYPES
export interface Location {
  type: "Point"
  coordinates: [number, number]
}

export interface WorkFilters {
  search: string
  status: string
  page: number
  limit: number
  latitude?: number
  longitude?: number
  maxDistance?: number
}

export interface MediaItem {
  url: string
  publicId: string
}

export interface Work {
  id?: string
  userId: string

  workTitle: string
  workCategory: string
  workType: "oneDay" | "multipleDay"

  date?: string
  startDate?: string
  endDate?: string
  time: string

  description: string

  voiceFile?: MediaItem | null
  videoFile?: string

  images?: MediaItem[]
  videos?: MediaItem[]

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

  status:
  | "pending"
  | "assigned"
  | "in-progress"
  | "completed"
  | "cancelled"

  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface PaginationInfo {
  total: number
  totalPages: number
  currentPage: number
  limit: number
}

// UI COMPONENTS

// BADGE
export interface BadgeProps {
  children: ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
}


// SELECT

export interface SelectProps {
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
  className?: string
  disabled?: boolean
}