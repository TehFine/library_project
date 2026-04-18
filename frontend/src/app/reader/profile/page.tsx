'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi, cardsApi, borrowsApi, finesApi } from '@/lib/api'
import { LibraryCard, User } from '@/types'
import { formatDate, cardStatusMap, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

// ── Avatar Card ───────────────────────────────────────────────────────────────
function AvatarCard({ user }: { user: User }) {
  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()
    : user.username.slice(0, 2).toUpperCase()

  return (
    <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#d4cbb8] to-[#e6dcc8] h-full min-h-[260px] shadow-sm border border-white/50">
      {/* Abstract face/photo placeholder using big blurred text or shape */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-overlay">
        <span className="text-[12rem] font-black text-black/20 tracking-tighter select-none">{initials[0]}</span>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-sm">{user.fullName || user.username}</h2>
          <p className="text-xs text-white/80 drop-shadow-sm mt-0.5">{user.role === 'reader' ? 'Thành viên Độc giả' : user.role}</p>
        </div>
        <div className="px-4 py-1.5 rounded-full border border-white/30 bg-black/20 backdrop-blur-md text-white text-xs font-semibold shadow-sm">
          {user.username}
        </div>
      </div>
    </div>
  )
}

// ── StatCardWithGraph ─────────────────────────────────────────────────────────
function StatCardWithGraph({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-[2rem] bg-white shadow-sm border border-amber-100/60 p-5 flex flex-col h-full relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <div className="w-6 h-6 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 max-w-[60px] leading-tight font-medium">{sub}</p>
      </div>
      
      <div className="mt-auto flex items-end justify-between gap-1.5 h-16 pt-2">
         {[40, 70, 30, 80, 50, 100, 60].map((h, i) => (
           <div key={i} className="w-full flex flex-col items-center gap-1.5">
             <div className="w-1.5 rounded-full bg-gray-100 flex-1 flex items-end overflow-hidden">
               <div className={cn("w-full rounded-full transition-all duration-1000", i === 5 ? "bg-amber-400" : "bg-gray-800")} style={{ height: `${h}%` }} />
             </div>
             <span className="text-[9px] font-bold text-gray-400">{'SMTWTFS'[i]}</span>
           </div>
         ))}
      </div>
    </div>
  )
}

// ── StatCardWithCircle ────────────────────────────────────────────────────────
function StatCardWithCircle({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-[2rem] bg-[#fbf9f4] shadow-sm border border-amber-100/50 p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <div className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 cursor-pointer">
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center relative py-2">
         <div className="w-28 h-28 relative flex items-center justify-center">
            {/* Background dashed circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
               <circle cx="56" cy="56" r="50" stroke="#f0eade" strokeWidth="6" fill="none" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            {/* Progress circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
               <circle cx="56" cy="56" r="50" stroke="#fbbf24" strokeWidth="6" fill="none" strokeDasharray="314" strokeDashoffset={value === 0 ? "314" : "150"} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="text-center">
               <p className="text-xl font-bold text-gray-900">{value}</p>
               <p className="text-[10px] text-gray-500 font-medium">{sub}</p>
            </div>
         </div>
      </div>
    </div>
  )
}

// ── StatCardSmall ─────────────────────────────────────────────────────────────
function StatCardSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2rem] bg-[#fbf9f4] border border-amber-100/80 p-5 flex flex-col h-full">
      <div className="flex justify-between items-baseline mb-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xl font-light text-gray-700">{value}</p>
      </div>
      <div className="flex gap-1.5 mt-auto text-[9px] font-bold text-gray-500 mb-1">
         <span className="flex-1">Hoạt động</span>
         <span className="w-12 text-center">Nghỉ</span>
         <span className="w-8 text-right">Khác</span>
      </div>
      <div className="flex gap-1.5">
         <div className="flex-1 h-8 rounded-xl bg-amber-400" />
         <div className="w-12 h-8 rounded-xl bg-gray-800" />
         <div className="w-8 h-8 rounded-xl bg-gray-400" />
      </div>
    </div>
  )
}

// ── AccordionPersonalInfo ─────────────────────────────────────────────────────
function AccordionPersonalInfo({ 
  user, editing, setEditing, onSave, loading, 
  fullName, setFullName, phone, setPhone, address, setAddress 
}: any) {
  const items = [
    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, label: 'Email liên hệ', value: user.email },
    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>, label: 'Điện thoại', value: user.phone || '—' },
    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: 'Địa chỉ', value: user.address || '—' },
    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: 'Ngày sinh', value: formatDate(user.dateOfBirth) || '—' },
  ]

  return (
    <div className="rounded-[2rem] bg-[#fdfcf9] border border-amber-100/80 p-5 h-full flex flex-col">
       <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-bold text-gray-800">Thông tin cá nhân</p>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-amber-100 hover:text-amber-600 transition-colors shadow-sm">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
            </button>
          ) : (
             <button onClick={() => setEditing(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-800">Hủy</button>
          )}
       </div>
       
       {editing ? (
          <form onSubmit={onSave} className="space-y-3 flex-1">
             <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Họ và tên" className="bg-white" />
             <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Số điện thoại" className="bg-white" />
             <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ" className="bg-white" />
             <Button type="submit" size="sm" loading={loading} fullWidth className="mt-2">Lưu thay đổi</Button>
          </form>
       ) : (
          <div className="space-y-2 flex-1">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f5efe4] border border-[#ebe0cd] cursor-pointer hover:bg-white hover:border-amber-200 transition-all group">
                <div className="flex items-center gap-3 text-gray-700 min-w-0 flex-1">
                  <span className="text-gray-400 group-hover:text-amber-500 transition-colors shrink-0">{it.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{it.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px]">{it.value}</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-800 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
       )}
    </div>
  )
}

// ── SecurityCard ──────────────────────────────────────────────────────────────
function SecurityCard({ 
  pwSection, setPwSection, currentPw, setCurrentPw, 
  newPw, setNewPw, confirmPw, setConfirmPw, 
  pwError, setPwError, handleChangePassword, pwLoading 
}: any) {
  return (
    <div className="rounded-[2rem] bg-[#fbf9f4] shadow-sm border border-amber-100/50 p-6 h-full flex flex-col relative overflow-hidden">
       {/* Fake Calendar Header */}
       <div className="flex justify-between items-center mb-6">
         <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-500 shadow-sm">Bảo mật</span>
         <span className="text-sm font-bold text-gray-800">Cài đặt tài khoản</span>
         <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-500 shadow-sm">Đổi MK</span>
       </div>
       
       <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
         {pwSection ? (
            <form onSubmit={handleChangePassword} className="space-y-3 bg-white p-5 rounded-3xl shadow-sm border border-amber-100/50">
               <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="Mật khẩu hiện tại" className="bg-gray-50" />
               <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" className="bg-gray-50" />
               <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Xác nhận mật khẩu mới" className="bg-gray-50" />
               {pwError && <p className="text-xs text-red-500 font-medium px-1">{pwError}</p>}
               <div className="flex gap-2 pt-2">
                 <Button type="button" variant="ghost" size="sm" onClick={() => { setPwSection(false); setPwError('') }} className="flex-1">Hủy</Button>
                 <Button type="submit" size="sm" loading={pwLoading} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white border-none">Lưu</Button>
               </div>
            </form>
         ) : (
            <div className="bg-[#292929] text-white rounded-3xl p-6 relative overflow-hidden shadow-lg mt-2">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                   <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 </div>
                 <div>
                   <p className="text-sm font-bold">Mật khẩu & Đăng nhập</p>
                   <p className="text-[10px] text-gray-400 mt-0.5">Bảo vệ tài khoản của bạn</p>
                 </div>
               </div>
               
               <Button variant="secondary" size="sm" onClick={() => setPwSection(true)} className="w-full border-none bg-white/10 hover:bg-white/20 text-white justify-between px-4">
                 Thay đổi mật khẩu
                 <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
               </Button>
            </div>
         )}
       </div>
    </div>
  )
}

// ── TallLibraryCard ───────────────────────────────────────────────────────────
function TallLibraryCard({ card }: { card: LibraryCard | null }) {
  if (!card) {
    return (
      <div className="rounded-[2rem] bg-[#2d2d2d] text-white p-6 h-full flex flex-col items-center justify-center text-center shadow-lg">
        <p className="text-sm text-gray-400">Chưa có thẻ thư viện</p>
      </div>
    )
  }

  const si = cardStatusMap[card.status]

  return (
    <div className="rounded-[2rem] bg-[#2d2d2d] text-white p-7 h-full flex flex-col relative overflow-hidden shadow-lg border border-white/5">
       <div className="flex justify-between items-center mb-8 mt-1">
          <h3 className="text-xl font-bold text-white tracking-tight">Thẻ Thư Viện</h3>
          <span className="text-xs font-bold px-4 py-2 bg-white/5 rounded-full text-amber-400 border border-white/10 shadow-sm">
             {si.label}
          </span>
       </div>

       <div className="space-y-3 flex-1">
          {/* Card Number Task */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all duration-300 group">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shadow-inner group-hover:bg-white/10 transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
               </div>
               <div>
                 <p className="text-sm font-bold text-gray-100">Mã Số Thẻ</p>
                 <p className="text-xs text-gray-500 mt-1 tracking-widest font-mono">{card.cardNumber}</p>
               </div>
             </div>
             <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-gray-900 shadow-lg shrink-0 ml-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
             </div>
          </div>

          {/* Issued Task */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all duration-300 group">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shadow-inner group-hover:bg-white/10 transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
               </div>
               <div>
                 <p className="text-sm font-bold text-gray-100">Ngày Cấp</p>
                 <p className="text-xs text-gray-500 mt-1">{formatDate(card.issuedDate)}</p>
               </div>
             </div>
             <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-gray-900 shadow-lg shrink-0 ml-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
             </div>
          </div>

          {/* Expiry Task */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all duration-300 group opacity-80">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shadow-inner group-hover:bg-white/10 transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div>
                 <p className="text-sm font-bold text-gray-100">Hết Hạn</p>
                 <p className="text-xs text-gray-500 mt-1">{formatDate(card.expiryDate)}</p>
               </div>
             </div>
             <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 ml-3" />
          </div>
       </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { toast } = useToast()
  const [user, setUser]       = useState<User | null>(null)
  const [card, setCard]       = useState<LibraryCard | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)

  // Stats
  const [borrowCount, setBorrowCount] = useState(0)
  const [fineCount, setFineCount]     = useState(0)

  // Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [address, setAddress]   = useState('')

  // Password
  const [pwSection, setPwSection]     = useState(false)
  const [currentPw, setCurrentPw]     = useState('')
  const [newPw, setNewPw]             = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [pwLoading, setPwLoading]     = useState(false)
  const [pwError, setPwError]         = useState('')

  useEffect(() => {
    Promise.all([
      authApi.me(),
      cardsApi.mine(),
      borrowsApi.mine({ status: 'borrowing', limit: 1 }),
      finesApi.mine({ status: 'pending', limit: 1 }),
    ]).then(([me, cards, borrows, fines]) => {
      setUser(me)
      setFullName(me.fullName ?? '')
      setPhone(me.phone ?? '')
      setAddress(me.address ?? '')
      setCard(cards.find(c => c.status === 'active') ?? cards[0] ?? null)
      setBorrowCount(borrows.total)
      setFineCount(fines.total)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ fullName, phone, address }),
      })
      setUser(prev => prev ? { ...prev, fullName, phone, address } : prev)
      setEditing(false)
      toast('Cập nhật thông tin thành công', 'success')
    } catch {
      toast('Cập nhật thất bại, thử lại sau', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw.length < 8) { setPwError('Mật khẩu mới ít nhất 8 ký tự'); return }
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp'); return }
    setPwLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwSection(false)
      toast('Đổi mật khẩu thành công', 'success')
    } catch {
      setPwError('Mật khẩu hiện tại không đúng')
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-[2rem]" />
          <Skeleton className="h-72 rounded-[2rem]" />
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
             <Skeleton className="h-48 rounded-[2rem]" />
             <Skeleton className="h-48 rounded-[2rem]" />
          </div>
          <Skeleton className="h-80 rounded-[2rem]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-[28rem] rounded-[2rem]" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
      
      {/* ── Left Column (Avatar + Info) ── */}
      <div className="flex flex-col gap-6">
        <AvatarCard user={user} />
        <AccordionPersonalInfo 
          user={user} editing={editing} setEditing={setEditing} 
          onSave={handleSaveProfile} loading={saving}
          fullName={fullName} setFullName={setFullName}
          phone={phone} setPhone={setPhone}
          address={address} setAddress={setAddress}
        />
      </div>

      {/* ── Middle Column (Stats + Security) ── */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          <StatCardWithGraph label="Đang mượn" value={borrowCount} sub="Sách hiện tại" />
          <StatCardWithCircle label="Phí phạt" value={fineCount > 0 ? `${fineCount}k` : '0'} sub="VNĐ cần đóng" />
        </div>
        <SecurityCard 
          pwSection={pwSection} setPwSection={setPwSection}
          currentPw={currentPw} setCurrentPw={setCurrentPw}
          newPw={newPw} setNewPw={setNewPw}
          confirmPw={confirmPw} setConfirmPw={setConfirmPw}
          pwError={pwError} setPwError={setPwError}
          handleChangePassword={handleChangePassword} pwLoading={pwLoading}
        />
      </div>

      {/* ── Right Column (Date + Tall Library Card) ── */}
      <div className="flex flex-col gap-6">
        <StatCardSmall label="Hoạt động" value={user.lastLogin ? "Online" : "Offline"} />
        <div className="flex-1 min-h-[300px]">
          <TallLibraryCard card={card} />
        </div>
      </div>

    </div>
  )
}