'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui'
import { authApi } from '@/lib/api'
import { User } from '@/types'
import { useToast } from '@/hooks/useToast'
import { AvatarCard, AccordionPersonalInfo, SecurityCard } from '@/components/profile/SharedProfile'

export default function AdminProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile Form state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Password state
  const [pwSection, setPwSection] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    authApi.me()
      .then((me) => {
        setUser(me)
        setFullName(me.fullName ?? '')
        setPhone(me.phone ?? '')
        setAddress(me.address ?? '')
        setDateOfBirth(me.dateOfBirth ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await authApi.updateProfile({ fullName, phone, address, dateOfBirth })
      setUser(updated)
      setEditing(false)
      toast('Đã cập nhật thông tin', 'success')
    } catch (err: any) {
      toast(err.message || 'Không thể lưu', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      setPwError('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPw.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }
    setPwError('')
    setPwLoading(true)
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw })
      setPwSection(false)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      toast('Đã đổi mật khẩu', 'success')
    } catch (err: any) {
      setPwError(err.message || 'Mật khẩu hiện tại không đúng')
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Hồ sơ cá nhân</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[260px] rounded-3xl" />
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[320px] rounded-3xl" />
            <Skeleton className="h-[320px] rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Quản lý thông tin và bảo mật tài khoản</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AvatarCard user={user} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AccordionPersonalInfo 
            user={user}
            editing={editing}
            setEditing={setEditing}
            onSave={handleSaveProfile}
            loading={saving}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            address={address}
            setAddress={setAddress}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
          />
          <SecurityCard 
            pwSection={pwSection}
            setPwSection={setPwSection}
            currentPw={currentPw}
            setCurrentPw={setCurrentPw}
            newPw={newPw}
            setNewPw={setNewPw}
            confirmPw={confirmPw}
            setConfirmPw={setConfirmPw}
            pwError={pwError}
            setPwError={setPwError}
            handleChangePassword={handleChangePassword}
            pwLoading={pwLoading}
          />
        </div>
      </div>
    </div>
  )
}
