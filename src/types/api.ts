import type { UserRole } from "workbee-common"

export interface ApiResponse<T = undefined> {
  success: boolean
  message?: string
  data: T
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

export interface ApiErrorResponse {
  success: false
  message?: string
  error?: string
  code?: string
}