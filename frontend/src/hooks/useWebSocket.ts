'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:3001'

let globalSocket: Socket | null = null

/**
 * Get or create a global WebSocket connection with userId auth.
 * Multiple consumers can share the same connection.
 */
function getSocket(userId?: string): Socket | null {
  if (typeof window === 'undefined') return null
  if (globalSocket?.connected) return globalSocket

  const query: Record<string, string> = {}
  if (userId) query.userId = userId

  globalSocket = io(`${WS_URL}/events`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
    query,
  })

  globalSocket.on('connect', () => {
    console.log(`[WS] Connected to ${WS_URL}/events [${globalSocket!.id}]`)
    // Gửi lại userId khi kết nối lại
    if (userId) {
      globalSocket!.emit('auth', { userId })
    }
  })

  globalSocket.on('disconnect', (reason) => {
    console.log(`[WS] Disconnected: ${reason}`)
  })

  globalSocket.on('connect_error', (err) => {
    console.warn(`[WS] Connection error: ${err.message}`)
  })

  return globalSocket
}

/**
 * Hook to connect to the backend WebSocket and listen for real-time events.
 * Uses a shared global socket connection so multiple listeners don't open
 * multiple connections.
 * 
 * @param event - The event name to listen for (e.g. 'librarian:dashboard-update')
 * @param callback - Callback to fire when the event is received
 * @param enabled - Whether the WebSocket connection should be active
 * @param userId - Optional user ID for auth (needed for force-logout events)
 */
export function useWebSocket<T = unknown>(
  event: string,
  callback: (data?: T) => void,
  enabled: boolean = true,
  userId?: string,
) {
  const callbackRef = useRef(callback)

  // Keep callback ref up-to-date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const socket = getSocket(userId)
    if (!socket) return

    const handler = (data: unknown) => {
      callbackRef.current(data as any)
    }

    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [event, enabled, userId])
}

/**
 * A higher-level hook that auto-refreshes a loadData function
 * when a specific WebSocket event is received.
 */
export function useRealtimeRefresh(
  event: string,
  loadData: () => void | Promise<void>,
  enabled: boolean = true,
  userId?: string,
) {
  const stableLoad = useCallback(() => {
    loadData()
  }, [loadData])

  useWebSocket(event, stableLoad, enabled, userId)
}
