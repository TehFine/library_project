'use client'
import { useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import TopBar from '@/components/layout/TopBar'
import MobileDrawer from '@/components/layout/MobileDrawer'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Giả lập user admin cho TopBar
  const mockAdmin = {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@library.vn',
    role: 'library_admin' as const,
    fullName: 'Administrator',
    phone: null,
    idCardNumber: null,
    dateOfBirth: null,
    address: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

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
        <AdminSidebar />
      </div>

      {/* ── Right column — TopBar + white card ── */}
      <div className="flex-1 flex flex-col min-w-0 gap-2 sm:gap-3">

        {/* TopBar lives on the amber background — hide search on admin */}
        <TopBar user={mockAdmin} onMenuToggle={() => setDrawerOpen(v => !v)} hideMobileAvatar={drawerOpen} />

        {/*
         * Main content card — white, rounded, takes all remaining height.
         * Only THIS scrolls; the amber shell stays fixed.
         */}
        <div
          className="flex-1 rounded-2xl sm:rounded-3xl overflow-hidden min-h-0"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 8px 40px rgba(180, 130, 50, 0.15)',
          }}
        >
          <div className="h-full overflow-y-auto px-4 py-4 sm:px-8 sm:py-8 pb-4 sm:pb-8">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer (hamburger menu) ── */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
