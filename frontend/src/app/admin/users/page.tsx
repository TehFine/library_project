'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { adminApi } from '@/lib/api'
import { User, Role } from '@/types'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { toast } from 'react-hot-toast'
import {
  Crown, UserCog, User as UserIcon, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Search, Shield, Lock, Unlock, type LucideIcon,
} from 'lucide-react'

/* ── Sub-components ─────────────────────────────────────────────────── */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 sm:px-6 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '50%' : j === 2 ? '30%' : '35%' }} />
        </td>
      ))}
    </tr>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <tr>
      <td colSpan={5} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Icon className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">{title}</p>
            {description && <p className="text-slate-300 text-xs mt-1">{description}</p>}
          </div>
        </div>
      </td>
    </tr>
  )
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [showLockModal, setShowLockModal] = useState<User | null>(null)
  const [lockReason, setLockReason] = useState('')
  const [lockLoading, setLockLoading] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>('reader')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const data = await adminApi.getAllUsers()
      setUsers(data)
    } catch {
      setFetchError(true)
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useRealtimeRefresh('admin:user-update', fetchUsers)

  const handleLockAccount = async () => {
    if (!showLockModal) return
    if (!lockReason.trim()) {
      toast.error('Vui lòng nhập lý do khóa tài khoản')
      return
    }
    setLockLoading(true)
    try {
      await adminApi.toggleUserStatus(showLockModal.id, false, lockReason.trim())
      toast.success('Đã khóa tài khoản')
      setShowLockModal(null)
      setLockReason('')
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi khóa tài khoản')
    } finally {
      setLockLoading(false)
    }
  }

  const handleUnlockAccount = async (user: User) => {
    try {
      await adminApi.toggleUserStatus(user.id, true)
      toast.success('Đã mở khóa tài khoản')
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi mở khóa tài khoản')
    }
  }

  const handleUpdateRole = async () => {
    if (!showRoleModal) return
    try {
      await adminApi.updateUserRole(showRoleModal.id, selectedRole)
      toast.success('Đã cập nhật vai trò')
      setShowRoleModal(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi cập nhật vai trò')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.isActive : !u.isActive)
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Quản lý danh sách độc giả, thủ thư và phân quyền hệ thống."
      />

      {/* Toolbar */}
      <Card padding="md" className="border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, username..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="text-xs shrink-0">
              <option value="all">Tất cả vai trò</option>
              <option value="reader">Độc giả</option>
              <option value="librarian">Thủ thư</option>
              <option value="library_admin">Quản trị viên</option>
            </Select>
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs shrink-0">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Bị khóa</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* User Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]"><thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Họ tên</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Email / Username</th>
                <th className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">Vai trò</th>
                <th className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">Trạng thái</th>
                <th className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : fetchError ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-red-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Không thể tải danh sách người dùng</p>
                      <p className="text-slate-300 text-xs">Vui lòng kiểm tra kết nối và thử lại</p>
                      <Button variant="secondary" size="sm" className="mt-3 rounded-xl" onClick={fetchUsers}>
                        <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <EmptyState
                  icon={UserIcon}
                  title="Không tìm thấy người dùng"
                  description={searchTerm || filterRole !== 'all' || filterStatus !== 'all' ? 'Thử thay đổi bộ lọc tìm kiếm' : 'Chưa có người dùng nào trong hệ thống'}
                />
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs ring-1 shrink-0 ${
                          user.role === 'library_admin' ? 'bg-purple-50 text-purple-600 ring-purple-100' :
                          user.role === 'librarian' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                          'bg-sky-50 text-sky-600 ring-sky-100'
                        }`}>
                          {(user.fullName || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.fullName || 'Chưa cập nhật'}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{user.phone || 'Chưa có SĐT'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-[140px] sm:max-w-none">{user.email}</p>
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <Badge className={
                        user.role === 'library_admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        user.role === 'librarian' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }>
                        {user.role === 'library_admin' ? <><Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1 text-amber-500" /> Admin</>
                          : user.role === 'librarian' ? <><UserCog className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1 text-blue-500" /> Thủ thư</>
                          : <><UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" /> Độc giả</>}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {user.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" /> Hoạt động
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-100">
                          <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" /> Bị khóa
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <button
                          onClick={() => { setShowRoleModal(user); setSelectedRole(user.role) }}
                          className="text-[10px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          <span className="hidden sm:inline">Đổi vai trò</span>
                          <span className="sm:hidden">Vai trò</span>
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => { setShowLockModal(user); setLockReason('') }}
                            className="text-[10px] sm:text-xs font-bold text-red-600 hover:bg-red-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" />
                            <span className="hidden sm:inline">Khóa</span>
                            <span className="sm:hidden">Khóa</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnlockAccount(user)}
                            className="text-[10px] sm:text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Unlock className="w-3 h-3" />
                            <span className="hidden sm:inline">Mở khóa</span>
                            <span className="sm:hidden">Mở</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && !fetchError && filteredUsers.length > 0 && (
          <div className="bg-slate-50/80 px-4 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              <Search className="w-3 h-3 inline mr-1" />
              {filteredUsers.length} / {users.length} người dùng
            </p>
          </div>
        )}
      </Card>

      {/* Role Modal */}
      <Modal open={!!showRoleModal} onClose={() => setShowRoleModal(null)} title={`Phân quyền cho ${showRoleModal?.fullName || showRoleModal?.username}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Chọn vai trò mới cho tài khoản này:</p>
          <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Role)} className="text-sm">
            <option value="reader">Độc giả</option>
            <option value="librarian">Thủ thư</option>
            <option value="library_admin">Quản trị viên</option>
          </Select>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button variant="ghost" className="justify-center" onClick={() => setShowRoleModal(null)}>Hủy</Button>
            <Button variant="primary" className="justify-center" onClick={handleUpdateRole}>Lưu thay đổi</Button>
          </div>
        </div>
      </Modal>

      {/* Lock Modal */}
      <Modal open={!!showLockModal} onClose={() => { setShowLockModal(null); setLockReason('') }} title={`Khóa tài khoản ${showLockModal?.fullName || showLockModal?.username}?`} size="md">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-800 text-xs items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p>Người dùng này sẽ bị đăng xuất khỏi tất cả thiết bị và không thể đăng nhập lại cho đến khi được mở khóa. Một thông báo kèm lý do sẽ được gửi đến người dùng trước khi khóa.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Lý do khóa tài khoản <span className="text-red-500">*</span>
            </label>
            <textarea
              value={lockReason}
              onChange={e => setLockReason(e.target.value)}
              placeholder="Ví dụ: Vi phạm chính sách mượn sách nhiều lần, sách trả quá hạn nhiều lần..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all resize-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button variant="ghost" className="justify-center" onClick={() => { setShowLockModal(null); setLockReason('') }}>Hủy</Button>
            <Button variant="danger" className="justify-center" loading={lockLoading} onClick={handleLockAccount}>
              <Lock className="w-4 h-4" /> Xác nhận khóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
