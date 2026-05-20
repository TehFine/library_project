import React from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { User } from '@/types'
import { formatDate } from '@/lib/utils'

// ── Avatar Card ───────────────────────────────────────────────────────────────
export function AvatarCard({ user }: { user: User }) {
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
          <p className="text-xs text-white/80 drop-shadow-sm mt-0.5">
            {user.role === 'reader' ? 'Thành viên Độc giả' : 
             user.role === 'librarian' ? 'Thủ thư' : 'Quản trị viên'}
          </p>
        </div>
        <div className="px-4 py-1.5 rounded-full border border-white/30 bg-black/20 backdrop-blur-md text-white text-xs font-semibold shadow-sm">
          {user.username}
        </div>
      </div>
    </div>
  )
}

// ── AccordionPersonalInfo ─────────────────────────────────────────────────────
export function AccordionPersonalInfo({ 
  user, editing, setEditing, onSave, loading, 
  fullName, setFullName, phone, setPhone, address, setAddress,
  dateOfBirth, setDateOfBirth
}: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
             <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} placeholder="Ngày sinh" className="bg-white" />
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
export function SecurityCard({ 
  pwSection, setPwSection, currentPw, setCurrentPw, 
  newPw, setNewPw, confirmPw, setConfirmPw, 
  pwError, setPwError, handleChangePassword, pwLoading 
}: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
