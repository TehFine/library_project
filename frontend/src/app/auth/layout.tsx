// Layout tối giản cho trang auth (login, register)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F5E6CC 0%, #EDD5AA 50%, #E8C885 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-0 left-0 w-64 h-64 rounded-full opacity-30 pointer-events-none"
           style={{ background: 'radial-gradient(circle, #F5B642 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
           style={{ background: 'radial-gradient(circle, #E8941A 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />

      <div className="relative w-full max-w-sm z-10">
        {children}
      </div>
    </div>
  )
}