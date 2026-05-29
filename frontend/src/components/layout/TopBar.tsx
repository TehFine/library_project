'use client'
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import UserAvatar from '@/components/ui/UserAvatar'
import { User } from '@/types'

interface TopBarProps {
  user: User | null
  isGuest?: boolean
  hideSearch?: boolean
  onMenuToggle?: () => void
}

export default function TopBar({ user, isGuest, hideSearch, onMenuToggle }: TopBarProps) {
  return (
    <>
      <header className="h-14 shrink-0 flex items-center gap-3 sm:gap-4 px-2 sm:px-4">
        {/* Hamburger menu — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all active:scale-90"
            aria-label="Mở menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}

        {/* Search bar — hidden on admin, hidden on mobile (< sm) */}
        {!hideSearch && (
          <div className="hidden sm:flex flex-1 justify-center">
            <SearchBar />
          </div>
        )}

        {/* Spacer on mobile when search is hidden */}
        {hideSearch && <div className="flex-1 md:hidden" />}

        {/* User info — desktop only (inline in flow) */}
        <div className="hidden md:block shrink-0">
          {isGuest ? (
            <Link 
              href="/auth/login"
              className="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-glow hover:scale-105 transition-transform"
            >
              Đăng nhập
            </Link>
          ) : (
            <UserAvatar user={user} />
          )}
        </div>
      </header>

      {/* Mobile: avatar / login floating at top-right corner */}
      <div className="md:hidden fixed top-3 right-3 z-50">
        {isGuest ? (
          <Link 
            href="/auth/login"
            className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            Đăng nhập
          </Link>
        ) : (
          <UserAvatar user={user} />
        )}
      </div>
    </>
  )
}
