'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { User } from '@/types'
import { getDashboardPath } from '@/lib/auth-utils'
import { io, Socket } from 'socket.io-client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login:  (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const WS_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:3001'

function useForceLogout(userId: string | null, onForceLogout: (reason?: string) => void) {
  useEffect(() => {
    if (!userId) return

    const query: Record<string, string> = { userId }
    const socket = io(`${WS_URL}/events`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      query,
    })

    socket.on('connect', () => {
      console.log(`[WS ForceLogout] Connected as user:${userId}`)
    })

    socket.on('force-logout', (data: any) => {
      console.log('[WS ForceLogout] Received force-logout:', data)
      onForceLogout(data?.reason || '')
    })

    return () => {
      socket.disconnect()
    }
  }, [userId, onForceLogout])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, [refresh])

  const handleForceLogout = useCallback((reason?: string) => {
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; max-age=0'
    setUser(null)
    const params = new URLSearchParams({ reason: 'locked' })
    if (reason) params.set('message', reason)
    router.push(`/auth/login?${params.toString()}`)
  }, [router])

  // Lắng nghe force-logout từ WebSocket
  useForceLogout(user?.id ?? null, handleForceLogout)

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password)
    // Lưu vào cả localStorage (cho API client) và cookie (cho middleware)
    localStorage.setItem('access_token', res.accessToken)
    document.cookie = `access_token=${res.accessToken}; path=/; max-age=${8 * 3600}; SameSite=Lax`
    setUser(res.user)
    router.push(getDashboardPath(res.user.role))
  }

  function logout() {
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; max-age=0'
    setUser(null)
    router.push('/reader/books')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}