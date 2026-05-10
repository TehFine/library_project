import AdminSidebar from '@/components/layout/AdminSidebar'
import TopBar from '@/components/layout/TopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-screen bg-app">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={mockAdmin} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
