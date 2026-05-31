'use client'
import { useEffect, useState } from 'react'
import LibrarianSidebar from '@/components/layout/LibrarianSidebar'
import TopBar from '@/components/layout/TopBar'
import MobileDrawer from '@/components/layout/MobileDrawer'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { authApi, librarianApi } from '@/lib/api'
import { User } from '@/types'

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  async function fetchPendingCount() {
    try {
      const res = await librarianApi.getPendingRequestsCount()
      setPendingRequestsCount(res.count)
      window.dispatchEvent(new CustomEvent('librarian-pending-count', { detail: { count: res.count } }))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    authApi.me().then(setUser).catch(() => setUser(null))
    fetchPendingCount()
  }, [])

  useRealtimeRefresh('librarian:dashboard-update', fetchPendingCount)

  return (
    /*
     * Full-screen amber shell — fixed, no scroll on the outer frame
     */
    <div
      className="h-screen w-screen flex overflow-hidden p-2 sm:p-4 gap-2 sm:gap-3"
      style={{ background: '#F5E6CC' }}
    >
      {/* ── Sidebar — hidden on mobile ── */}
      <div className="hidden md:block h-full">
        <LibrarianSidebar pendingRequestsCount={pendingRequestsCount} />
      </div>

      {/* ── Right column — TopBar + white card ── */}
      <div className="flex-1 flex flex-col min-w-0 gap-2 sm:gap-3">

        {/* TopBar lives on the amber background */}
        <TopBar user={user} onMenuToggle={() => setDrawerOpen(v => !v)} />

        {/*
         * Main content card — white, rounded, takes all remaining height.
         * Only THIS scrolls; the amber shell stays fixed.
         */}
        <div
          className="flex-1 rounded-2xl sm:rounded-3xl overflow-hidden min-h-0 relative"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 8px 40px rgba(180, 130, 50, 0.15)',
          }}
        >
          <div className="h-full overflow-y-auto px-4 py-4 sm:px-8 sm:py-8 pb-4 sm:pb-8">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer (hamburger menu) ── */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pendingRequestsCount={pendingRequestsCount} />
    </div>
  )
}
