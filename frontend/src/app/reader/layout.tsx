'use client'
import { useEffect, useState } from 'react'
import ReaderSidebar from '@/components/layout/ReaderSidebar'
import TopBar from '@/components/layout/TopBar'
import { authApi } from '@/lib/api'
import { User } from '@/types'

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    authApi.me().then(setUser).catch(() => setUser(null))
  }, [])

  return (
    /*
     * Full-screen amber shell — fixed, no scroll on the outer frame
     */
    <div
      className="h-screen w-screen flex overflow-hidden p-4 gap-3"
      style={{ background: '#F5E6CC' }}
    >
      {/* ── Sidebar — on amber background, full height ── */}
      <ReaderSidebar />

      {/* ── Right column — TopBar + white card ── */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">

        {/* TopBar lives on the amber background */}
        <TopBar user={user} />

        {/*
         * Main content card — white, rounded, takes all remaining height.
         * Only THIS scrolls; the amber shell stays fixed.
         */}
        <div
          className="flex-1 rounded-3xl overflow-hidden min-h-0"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 8px 40px rgba(180, 130, 50, 0.15)',
          }}
        >
          <div className="h-full overflow-y-auto px-8 py-8">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}