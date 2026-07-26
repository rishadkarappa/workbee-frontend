import type { ApiErrorResponse } from "@/types/api"
import { AxiosError } from "axios"


export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

// Small local guard so you don't depend on axios's own isAxiosError typing quirks
function isAxiosError<T>(error: unknown): error is AxiosError<T> {
  return typeof error === "object" && error !== null && "isAxiosError" in error
}