'use client'
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import UserAvatar from '@/components/ui/UserAvatar'
import { User } from '@/types'

interface TopBarProps {
  user: User | null
  isGuest?: boolean
  hideSearch?: boolean
}

export default function TopBar({ user, isGuest, hideSearch }: TopBarProps) {
  return (
    /*
     * TopBar sits on the amber background — no white, no blur.
     * Height is fixed so it doesn't grow.
     */
    <header className="h-14 shrink-0 flex items-center gap-4 px-4">
      {/* Search bar — hidden on admin */}
      {!hideSearch && (
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>
      )}

      {/* User info — right side */}
      <div className="shrink-0">
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
  )
}
