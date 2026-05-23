'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { adminApi } from '@/lib/api'
import { User, Role } from '@/types'
import { toast } from 'react-hot-toast'

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLockModal, setShowLockModal] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>('reader')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getAllUsers()
      setUsers(data)
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async (user: User) => {
    try {
      await adminApi.toggleUserStatus(user.id, !user.isActive)
      toast.success(user.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản')
      setShowLockModal(null)
      fetchUsers()
    } catch (error) {
      toast.error('Lỗi khi thay đổi trạng thái')
    }
  }

  const handleUpdateRole = async () => {
    if (!showRoleModal) return
    try {
      await adminApi.updateUserRole(showRoleModal.id, selectedRole)
      toast.success('Đã cập nhật vai trò')
      setShowRoleModal(null)
      fetchUsers()
    } catch (error) {
      toast.error('Lỗi khi cập nhật vai trò')
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
      <Card padding="md" className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px]">
          <Input 
            placeholder="Tìm theo tên, email, username..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-40">
          <Select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="reader">Độc giả</option>
            <option value="librarian">Thủ thư</option>
            <option value="library_admin">Quản trị viên</option>
          </Select>
        </div>
        <div className="w-40">
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khóa</option>
          </Select>
        </div>
      </Card>

      {/* User Table */}
      <Card padding="none" className="overflow-hidden border-none shadow-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Họ tên</th>
              <th className="px-6 py-4">Email / Username</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Không tìm thấy người dùng nào</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${
                        user.role === 'library_admin' ? 'bg-purple-50 text-purple-600 ring-purple-100' :
                        user.role === 'librarian' ? 'bg-indigo-50 text-indigo-600 ring-indigo-100' :
                        'bg-sky-50 text-sky-600 ring-sky-100'
                      }`}>
                        {(user.fullName || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.fullName || 'Chưa cập nhật'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{user.phone || 'Chưa có SĐT'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      user.role === 'library_admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      user.role === 'librarian' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      {user.role === 'library_admin' ? '👑 Admin' : user.role === 'librarian' ? '🟦 Thủ thư' : '👤 Độc giả'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">✅ Hoạt động</Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-700 border-red-100">🔴 Bị khóa</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setShowRoleModal(user)
                          setSelectedRole(user.role)
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-bold"
                      >
                        Đổi vai trò
                      </button>
                      {user.isActive ? (
                        <button 
                          onClick={() => setShowLockModal(user)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-xs font-bold"
                        >
                          Khóa
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-xs font-bold"
                        >
                          Mở khóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Role Modal */}
      <Modal open={!!showRoleModal} onClose={() => setShowRoleModal(null)} title={`Phân quyền cho ${showRoleModal?.fullName || showRoleModal?.username}`} size="sm">
        <div className="space-y-4">
           <p className="text-sm text-slate-600">Chọn vai trò mới cho tài khoản này:</p>
           <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Role)}>
              <option value="reader">Độc giả</option>
              <option value="librarian">Thủ thư</option>
              <option value="library_admin">Quản trị viên</option>
           </Select>
           <div className="flex justify-end gap-3 pt-2">
             <Button variant="ghost" onClick={() => setShowRoleModal(null)}>Hủy</Button>
             <Button variant="primary" onClick={handleUpdateRole}>Lưu thay đổi</Button>
           </div>
        </div>
      </Modal>

      {/* Lock Modal */}
      <Modal open={!!showLockModal} onClose={() => setShowLockModal(null)} title={`Khóa tài khoản ${showLockModal?.fullName || showLockModal?.username}?`} size="sm">
        <div className="space-y-4">
           <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-800 text-xs">
              <span className="text-xl">⚠️</span>
              <p>Người dùng này sẽ bị đăng xuất khỏi tất cả thiết bị và không thể đăng nhập lại cho đến khi được mở khóa.</p>
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <Button variant="ghost" onClick={() => setShowLockModal(null)}>Hủy</Button>
             <Button variant="danger" onClick={() => showLockModal && handleToggleStatus(showLockModal)}>Xác nhận khóa</Button>
           </div>
        </div>
      </Modal>
    </div>
  )
}
