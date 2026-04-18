'use client'
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import UserAvatar from '@/components/ui/UserAvatar'
import { User } from '@/types'

interface TopBarProps {
  user: User | null
}

export default function TopBar({ user }: TopBarProps) {
  return (
    /*
     * TopBar sits on the amber background — no white, no blur.
     * Height is fixed so it doesn't grow.
     */
    <header className="h-14 shrink-0 flex items-center gap-4 px-4">
      {/* Search bar takes the middle space */}
      <div className="flex-1 flex justify-center">
        <SearchBar />
      </div>

      {/* User avatar — right side */}
      <div className="shrink-0">
        <UserAvatar user={user} />
      </div>
    </header>
  )
}
