'use client'

import { useEffect, ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'
import toast from 'react-hot-toast'

interface Props {
  children: ReactNode
}

export default function GlobalErrorHandler({ children }: Props) {
  useEffect(() => {
    // ── Global handler for unhandled promise rejections ──────────────
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      // Ignore errors triggered during page navigation / redirect
      if (
        error?.message?.includes('redirect') ||
        error?.message?.includes('Navigation') ||
        error?.message?.includes('canceled')
      ) {
        return
      }

      console.warn('[Global:unhandledRejection]', error?.message || error)

      // Show a toast for API errors so the user knows something went wrong
      if (error?.name === 'ApiError' || error?.status) {
        const msg = error?.message || 'Đã có lỗi xảy ra, vui lòng thử lại'
        toast.error(msg, { id: 'api-error', duration: 4000 })
        // Only suppress the browser console error for errors we handle with a toast
        event.preventDefault()
      }
    }

    // ── Global handler for uncaught runtime errors ───────────────────
    const handleError = (event: ErrorEvent) => {
      // Ignore hydration mismatch warnings — Next.js handles those gracefully
      if (
        event.error?.message?.includes('hydrat') ||
        event.message?.includes('hydrat') ||
        event.error?.message?.includes('Hydrat') ||
        event.message?.includes('Hydrat')
      ) {
        console.info('[Global:error] Hydration mismatch suppressed')
        event.preventDefault()
        return
      }

      console.warn('[Global:error]', event.error?.message || event.message)
    }

    window.addEventListener('unhandledrejection', handleRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <ErrorBoundary
      onError={(error) => {
        // Log caught errors to console (already done by ErrorBoundary)
        // Could send to an error reporting service here
        console.debug('[ErrorBoundary] Render error caught:', error.message)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
