'use client'
import Link from 'next/link'
import UserAvatar from '@/components/ui/UserAvatar'
import { User } from '@/types'
import { cn } from '@/lib/utils'

interface TopBarProps {
  user: User | null
  isGuest?: boolean
  hideMobileAvatar?: boolean
  onMenuToggle?: () => void
}

export default function TopBar({ user, isGuest, hideMobileAvatar, onMenuToggle }: TopBarProps) {
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

        {/* Spacer — đẩy avatar/login sang phải trên mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Mobile: avatar / login — gọn trong header, không fixed */}
      <div className={cn('sm:hidden transition-opacity duration-300', hideMobileAvatar && 'opacity-0 pointer-events-none')}>
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
    </>
  )
}
