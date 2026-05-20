'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi, cardsApi, borrowsApi, finesApi } from '@/lib/api'
import { LibraryCard, User } from '@/types'
import { formatDate, cardStatusMap, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import Link from 'next/link'

import { AvatarCard, AccordionPersonalInfo, SecurityCard } from '@/components/profile/SharedProfile'

// ── StatCardWithGraph ─────────────────────────────────────────────────────────
function StatCardWithGraph({ label, value, sub, href }: { label: string; value: string | number; sub: string; href?: string }) {
  return (
    <div className="rounded-[2rem] bg-white shadow-sm border border-amber-100/60 p-5 flex flex-col h-full relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {href ? (
          <Link href={href} className="w-6 h-6 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
          </Link>
        ) : (
          <div className="w-6 h-6 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
          </div>
        )}
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
function StatCardWithCircle({ label, value, sub, href }: { label: string; value: string | number; sub: string; href?: string }) {
  return (
    <div className="rounded-[2rem] bg-[#fbf9f4] shadow-sm border border-amber-100/50 p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {href ? (
          <Link href={href} className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
          </Link>
        ) : (
          <div className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 cursor-pointer">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
          </div>
        )}
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
    <div className="rounded-[2rem] bg-[#fbf9f4] border border-amber-100/80 p-5 flex flex-col shadow-sm">
      <div className="flex justify-between items-baseline mb-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xl font-light text-gray-700">{value}</p>
      </div>
      <div className="flex gap-1 mt-auto">
         <div className="flex-1 h-2 rounded-full bg-amber-400" />
         <div className="w-6 h-2 rounded-full bg-gray-800" />
         <div className="w-4 h-2 rounded-full bg-gray-300" />
      </div>
    </div>
  )
}

// ── TallLibraryCard ───────────────────────────────────────────────────────────
function TallLibraryCard({ card }: { card: LibraryCard | null }) {
  if (!card) {
    return (
      <div className="rounded-[2.5rem] bg-gradient-to-br from-gray-800 to-black text-white p-8 h-full flex flex-col items-center justify-center text-center shadow-xl border border-white/10">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-500">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
        </div>
        <p className="text-base font-bold text-gray-300">Chưa có thẻ thư viện</p>
        <p className="text-xs text-gray-500 mt-2">Đăng ký thẻ ngay tại trang chi tiết sách để bắt đầu mượn.</p>
      </div>
    )
  }

  const si = cardStatusMap[card.status] || { label: card.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="rounded-[2.5rem] bg-[#1a1a1a] text-white p-8 h-full flex flex-col relative overflow-hidden shadow-2xl border border-white/5">
       {/* Background decorative elements */}
       <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />
       <div className="absolute bottom-[-5%] left-[-5%] w-32 h-32 bg-blue-400/5 rounded-full blur-3xl" />

       <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Thẻ Thư Viện</h3>
            <p className="text-[10px] text-amber-400 font-bold tracking-[0.2em] uppercase mt-1">Hệ thống thư viện thông minh</p>
          </div>
          <span className={cn("text-[10px] font-black px-3 py-1 rounded-md shadow-sm uppercase tracking-wider", si.color)}>
             {si.label}
          </span>
       </div>

       <div className="space-y-6 flex-1 relative z-10">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Mã số thành viên</p>
            <div className="flex items-center gap-3">
              <span className="text-xl tracking-[0.2em] text-white font-black">{card.cardNumber}</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Ngày cấp</p>
              <p className="text-sm font-bold text-gray-100">{formatDate(card.issuedDate)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Hết hạn</p>
              <p className="text-sm font-bold text-gray-100">{formatDate(card.expiryDate)}</p>
            </div>
          </div>
       </div>

       <div className="mt-auto pt-6 flex justify-between items-end relative z-10 border-t border-white/5">
          <div className="flex gap-1.5">
            {[1,2,3].map(i => <div key={i} className="w-8 h-1 rounded-full bg-white/20" />)}
          </div>
          <svg className="w-12 h-12 text-white/10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
          </svg>
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
  const [fineAmount, setFineAmount]   = useState(0)

  // Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [address, setAddress]   = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

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
      setDateOfBirth(me.dateOfBirth ?? '')
      setCard(cards.find(c => c.status === 'active') ?? cards[0] ?? null)
      setBorrowCount(borrows.total)
      setFineAmount(fines.totalAmount ?? 0)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateProfile({ fullName, phone, address, dateOfBirth })
      setUser(prev => prev ? { ...prev, fullName, phone, address, dateOfBirth } : prev)
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
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw })
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
          dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
        />
      </div>

      {/* ── Middle Column (Stats + Security) ── */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          <StatCardWithGraph label="Đang mượn" value={borrowCount} sub="Sách hiện tại" href="/reader/borrows" />
          <StatCardWithCircle 
            label="Phí phạt" 
            value={fineAmount >= 1000 ? `${(fineAmount / 1000).toFixed(0)}k` : fineAmount} 
            sub="VNĐ cần đóng" 
            href="/reader/fines"
          />
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

      {/* ── Right Column (Activity + Tall Library Card) ── */}
      <div className="flex flex-col gap-6">
        <StatCardSmall label="Hoạt động" value={user.lastLogin ? "Online" : "Offline"} />
        <div className="flex-1 min-h-[360px]">
          <TallLibraryCard card={card} />
        </div>
      </div>

    </div>
  )
}