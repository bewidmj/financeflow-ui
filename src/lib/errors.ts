import axios from 'axios'
import type { ApiError } from '../types/api'

export function apiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiError>(error)) {
    return error instanceof Error ? error.message : 'Something went wrong.'
  }
  if (!error.response) {
    return 'Could not reach the server. Check that both backend services are running.'
  }
  const { status, data } = error.response
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested item could not be found.'
  if (status >= 500) return 'The server encountered an error. Please try again.'
  if (data?.fieldErrors) {
    return Object.entries(data.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(' · ')
  }
  return data?.message || data?.error || `Request failed (${status}).`
}
