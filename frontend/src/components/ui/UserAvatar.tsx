'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: User | null
  className?: string
}

function getInitials(user: User): string {
  if (user.fullName) {
    return user.fullName
      .split(' ')
      .map(n => n[0])
      .slice(-2)
      .join('')
      .toUpperCase()
  }
  return user.username.slice(0, 2).toUpperCase()
}

function getDisplayName(user: User): string {
  return user.fullName ?? user.username
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; max-age=0'
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <div className={cn('w-10 h-10 rounded-full bg-amber-200 animate-pulse', className)} />
    )
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 group"
        aria-label="User menu"
      >
        {/* Avatar circle */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow shrink-0 ring-2 ring-white/70 group-hover:ring-primary/40 transition-all duration-300">
          <span className="text-white text-sm font-semibold leading-none">{getInitials(user)}</span>
        </div>

        {/* Name + chevron */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800">{getDisplayName(user)}</span>
          <svg
            className={cn('w-4 h-4 text-gray-500 transition-transform duration-300', open && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white shadow-card border border-amber-100 z-50 overflow-hidden animate-scale-in">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-amber-50">
            <p className="text-sm font-semibold text-gray-800">{getDisplayName(user)}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => { router.push('/reader/profile'); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Hồ sơ cá nhân
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
