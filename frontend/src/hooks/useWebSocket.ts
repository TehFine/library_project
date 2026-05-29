'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:3001'

/**
 * Hook to connect to the backend WebSocket and listen for real-time events.
 * 
 * @param event - The event name to listen for (e.g. 'librarian:dashboard-update')
 * @param callback - Callback to fire when the event is received
 * @param enabled - Whether the WebSocket connection should be active
 */
export function useWebSocket<T = unknown>(
  event: string,
  callback: (data?: T) => void,
  enabled: boolean = true
) {
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref up-to-date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const socket = io(`${WS_URL}/events`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log(`[WS] Connected to ${WS_URL}/events [${socket.id}]`)
    })

    socket.on(event, (data: unknown) => {
      console.log(`[WS] Event received: ${event}`, data)
      callbackRef.current(data as any)
    })

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Disconnected: ${reason}`)
    })

    socket.on('connect_error', (err) => {
      console.warn(`[WS] Connection error: ${err.message}`)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [event, enabled])
}

/**
 * A higher-level hook that auto-refreshes a loadData function
 * when a specific WebSocket event is received.
 */
export function useRealtimeRefresh(
  event: string,
  loadData: () => void | Promise<void>,
  enabled: boolean = true
) {
  const stableLoad = useCallback(() => {
    loadData()
  }, [loadData])

  useWebSocket(event, stableLoad, enabled)
}
