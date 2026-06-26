'use client'
import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi, cardsApi } from '@/lib/api'
import { LibraryCard, User } from '@/types'
import { formatDate, cardStatusMap, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'

import { Check } from 'lucide-react'
import { AvatarCard, AccordionPersonalInfo, SecurityCard } from '@/components/profile/SharedProfile'

// ── StatCardSmall (replaced: đang mượn & phí phạt) ────────────────────────────
function StatCardSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white border border-amber-100/80 p-5 flex flex-col shadow-card">
      <div className="flex justify-between items-baseline mb-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xl font-light text-amber-700">{value}</p>
      </div>
      <div className="flex gap-1 mt-auto">
         <div className="flex-1 h-2 rounded-full bg-amber-200" />
         <div className="w-6 h-2 rounded-full bg-amber-400" />
         <div className="w-4 h-2 rounded-full bg-amber-100" />
      </div>
    </div>
  )
}

// ── TallLibraryCard ───────────────────────────────────────────────────────────
function TallLibraryCard({ card, onRequestComplete }: { card: LibraryCard | null; onRequestComplete?: () => void }) {
  const { toast } = useToast()
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  const handleRequestCard = async () => {
    setRequesting(true)
    try {
      await cardsApi.requestActivation()
      setRequested(true)
      toast('Đã gửi yêu cầu cấp thẻ thành công!', 'success')
      onRequestComplete?.()
    } catch (err: any) {
      toast(err?.message || 'Gửi yêu cầu thất bại', 'error')
    } finally {
      setRequesting(false)
    }
  }

  if (!card) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 p-8 h-full flex flex-col items-center justify-center text-center shadow-card border border-amber-200/60">
        <div className="w-16 h-16 rounded-full bg-amber-200/40 flex items-center justify-center mb-4 text-amber-500">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
        </div>
        <p className="text-base font-bold text-amber-800">Chưa có thẻ thư viện</p>
        <p className="text-xs text-amber-600/70 mt-2 mb-4">Đăng ký thẻ ngay để bắt đầu mượn sách.</p>
        <button
          onClick={handleRequestCard}
          disabled={requesting || requested}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {requesting ? 'Đang gửi...' : requested ? <><Check className="w-4 h-4" /> Đã gửi yêu cầu</> : 'Yêu cầu cấp thẻ'}
        </button>
      </div>
    )
  }

  if (card.status === 'pending') {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 p-8 h-full flex flex-col items-center justify-center text-center shadow-card border border-amber-200/60">
        <div className="w-16 h-16 rounded-full bg-amber-200/40 flex items-center justify-center mb-4 text-amber-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-base font-bold text-amber-800">Đang chờ duyệt</p>
        <p className="text-xs text-amber-600/70 mt-2">Yêu cầu cấp thẻ của bạn đã được gửi. Vui lòng chờ thủ thư xác nhận.</p>
      </div>
    )
  }

  if (card.status === 'rejected') {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-red-50 to-red-100 text-red-900 p-8 h-full flex flex-col items-center justify-center text-center shadow-card border border-red-200/60">
        <div className="w-16 h-16 rounded-full bg-red-200/40 flex items-center justify-center mb-4 text-red-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <p className="text-base font-bold text-red-800">Yêu cầu bị từ chối</p>
        <p className="text-xs text-red-600/70 mt-2 mb-4">Liên hệ thủ thư để biết thêm chi tiết.</p>
        <button
          onClick={handleRequestCard}
          disabled={requesting || requested}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {requesting ? 'Đang gửi...' : requested ? <><Check className="w-4 h-4" /> Đã gửi yêu cầu</> : 'Gửi yêu cầu lại'}
        </button>
      </div>
    )
  }

  const si = cardStatusMap[card.status] || { label: card.status, color: 'bg-amber-100 text-amber-700' }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-200 via-amber-100 to-amber-50 text-amber-900 p-8 h-full flex flex-col relative overflow-hidden shadow-card border border-amber-200/80">
       {/* Background decorative elements */}
       <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-amber-300/20 rounded-full blur-3xl" />
       <div className="absolute bottom-[-5%] left-[-5%] w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />

       <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-amber-800 tracking-tight uppercase italic">Thẻ Thư Viện</h3>
            <p className="text-[10px] text-amber-600 font-bold tracking-[0.2em] uppercase mt-1">Hệ thống thư viện thông minh</p>
          </div>
          <span className={cn("text-[10px] font-black px-3 py-1 rounded-md shadow-sm uppercase tracking-wider", si.color)}>
             {si.label}
          </span>
       </div>

       <div className="space-y-6 flex-1 relative z-10">
          <div>
            <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest mb-2">Mã số thành viên</p>
            <div className="flex items-center gap-3">
              <span className="text-xl tracking-[0.2em] text-amber-900 font-black">{card.cardNumber}</span>
              <div className="h-[1px] flex-1 bg-amber-300/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest mb-1.5">Ngày cấp</p>
              <p className="text-sm font-bold text-amber-800">{formatDate(card.issuedDate)}</p>
            </div>
            <div>
              <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest mb-1.5">Hết hạn</p>
              <p className="text-sm font-bold text-amber-800">{formatDate(card.expiryDate)}</p>
            </div>
          </div>
       </div>

       <div className="mt-auto pt-6 flex justify-between items-end relative z-10 border-t border-amber-300/30">
          <div className="flex gap-1.5">
            {[1,2,3].map(i => <div key={i} className="w-8 h-1 rounded-full bg-amber-400/30" />)}
          </div>
          <svg className="w-12 h-12 text-amber-400/30" fill="currentColor" viewBox="0 0 24 24">
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

  const loadData = useCallback(() => {
    Promise.all([
      authApi.me(),
      cardsApi.mine(),
    ]).then(([me, cards]) => {
      setUser(me)
      setFullName(me.fullName ?? '')
      setPhone(me.phone ?? '')
      setAddress(me.address ?? '')
      setDateOfBirth(me.dateOfBirth ?? '')
      setCard(cards.find(c => c.status === 'active') ?? cards[0] ?? null)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Re-fetch khi có sự kiện realtime (ví dụ: librarian thu phí, trả sách, gia hạn thẻ...)
  useRealtimeRefresh('reader:dashboard-update', loadData)

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
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
        <div className="space-y-6">

          <Skeleton className="h-80 rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-[28rem] rounded-3xl" />
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
        <StatCardSmall label="Ngày tham gia" value={formatDate(user.createdAt)} />
        <div className="flex-1 min-h-[360px]">
          <TallLibraryCard card={card} onRequestComplete={loadData} />
        </div>
      </div>

    </div>
  )
}