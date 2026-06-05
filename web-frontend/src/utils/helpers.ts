import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

/** Extract a human-readable error message from an Axios error response. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError?.response?.data?.error ?? fallback
}

/** Format a price number to a display string (e.g. 1500 → "$1,500"). */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'Not for sale'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

/** Format an ISO date string to a short readable date. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Convert degrees to radians (used for 3D rotations). */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Build a FormData object from an artwork payload + image file. */
export function buildArtworkFormData(
  data: Record<string, unknown>,
  imageFile?: File,
): FormData {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })
  if (imageFile) {
    formData.append('imageFile', imageFile)
  }
  return formData
}

/** Truncate a string to a max length with an ellipsis. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/** Generate initials from a display name (e.g. "Jane Doe" → "JD"). */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

/**
 * Get correct image URL — rewrites Azurite URLs through Vite proxy in development.
 *
 * Problem:  http://127.0.0.1:10000/devstoreaccount1/...  → blocked by CORS
 * Solution: /blob-proxy/devstoreaccount1/...             → Vite proxies to Azurite server-side
 *
 * In production the URL is already a real CDN/blob URL so no rewrite needed.
 */
export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/default-artwork.jpg'

  // Development: rewrite Azurite direct URLs through the Vite proxy
  if (import.meta.env.DEV) {
    if (url.includes('127.0.0.1:10000')) {
      return url.replace('http://127.0.0.1:10000', '/blob-proxy')
    }
    if (url.includes('localhost:10000')) {
      return url.replace('http://localhost:10000', '/blob-proxy')
    }
  }

  return url
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatRelativeTime(timestamp: number): string {
  const now  = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours / 24)

  if (days > 0)    return `${days}d ago`
  if (hours > 0)   return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}