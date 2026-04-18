'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login:  (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

  useEffect(() => { refresh() }, [refresh])

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password)
    // Lưu vào cả localStorage (cho API client) và cookie (cho middleware)
    localStorage.setItem('access_token', res.accessToken)
    document.cookie = `access_token=${res.accessToken}; path=/; max-age=${8 * 3600}; SameSite=Lax`
    setUser(res.user)
    router.push('/dashboard')
  }

  function logout() {
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; max-age=0'
    setUser(null)
    router.push('/login')
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