'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

// Mock Data
const MOCK_STAFF = [
  { id: 'S001', name: 'Nguyễn Thị Lan', email: 'lan@library.vn', role: 'librarian', status: 'active', phone: '0901234567' },
  { id: 'S002', name: 'Trần Văn Bình', email: 'binh@library.vn', role: 'librarian', status: 'locked', phone: '0901234568' },
  { id: 'S003', name: 'Lê Thị Mai', email: 'mai@library.vn', role: 'librarian', status: 'active', phone: '0901234569' },
  { id: 'S004', name: 'Phạm Văn Thành', email: 'thanh@library.vn', role: 'librarian', status: 'active', phone: '0901234570' },
]

export default function StaffManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLockModal, setShowLockModal] = useState<any>(null)
  const [showResetModal, setShowResetModal] = useState<any>(null)
  
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quản lý tài khoản nhân viên" 
        description="Quản lý danh sách thủ thư và phân quyền hệ thống."
      />

      {/* Toolbar */}
      <Card padding="md" className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px]">
          <Input 
            placeholder="Tìm theo tên, email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-40">
          <Select placeholder="Vai trò">
            <option value="librarian">Thủ thư</option>
            <option value="admin">Quản trị viên</option>
          </Select>
        </div>
        <div className="w-40">
          <Select placeholder="Trạng thái">
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khóa</option>
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Tạo tài khoản mới
        </Button>
      </Card>

      {/* User Table */}
      <Card padding="none" className="overflow-hidden border-none shadow-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Họ tên</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_STAFF.map(staff => (
              <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-indigo-100">
                      {staff.name.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{staff.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{staff.email}</td>
                <td className="px-6 py-4">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100">🟦 Thủ thư</Badge>
                </td>
                <td className="px-6 py-4">
                  {staff.status === 'active' ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">✅ Hoạt động</Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-700 border-red-100">🔴 Bị khóa</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-bold">
                      Sửa
                    </button>
                    {staff.status === 'active' ? (
                      <button 
                        onClick={() => setShowLockModal(staff)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-xs font-bold"
                      >
                        Khóa
                      </button>
                    ) : (
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-xs font-bold">
                        Mở khóa
                      </button>
                    )}
                    <button 
                      onClick={() => setShowResetModal(staff)}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold"
                    >
                      Đặt lại MK
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
           <p>Hiển thị 1-4 / 8 tài khoản</p>
           <div className="flex gap-2">
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">‹</button>
              <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">1</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">2</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">›</button>
           </div>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo tài khoản Thủ thư" size="md">
        <div className="space-y-4">
          <Input label="Họ và tên" placeholder="Nhập họ tên đầy đủ..." />
          <Input label="Email" type="email" placeholder="email@library.vn" />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Tên đăng nhập" placeholder="username" />
             <Input label="Số điện thoại" placeholder="09xx..." />
          </div>
          <Select label="Vai trò">
            <option value="librarian">Thủ thư</option>
            <option value="admin">Quản trị viên</option>
          </Select>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
             <span className="text-xl">⚠️</span>
             <p className="text-xs text-amber-800 leading-relaxed">
               Mật khẩu tạm thời sẽ được hệ thống tạo ngẫu nhiên và gửi qua email tự động cho nhân viên sau khi tài khoản được kích hoạt.
             </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Hủy</Button>
             <Button variant="primary">Tạo tài khoản</Button>
          </div>
        </div>
      </Modal>

      {/* Lock Modal */}
      <Modal open={!!showLockModal} onClose={() => setShowLockModal(null)} title={`Khóa tài khoản ${showLockModal?.name}?`} size="sm">
        <div className="space-y-4">
           <p className="text-sm text-slate-600">Lý do khóa tài khoản:</p>
           <Input placeholder="Nhập lý do..." />
           <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-800 text-xs">
              <span className="text-xl">⚠️</span>
              <p>Nhân viên này sẽ không thể đăng nhập vào hệ thống ngay lập tức và các phiên làm việc hiện tại sẽ bị hủy.</p>
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <Button variant="ghost" onClick={() => setShowLockModal(null)}>Hủy</Button>
             <Button variant="danger">Xác nhận khóa</Button>
           </div>
        </div>
      </Modal>

      {/* Reset Modal */}
      <Modal open={!!showResetModal} onClose={() => setShowResetModal(null)} title="Đặt lại mật khẩu" size="sm">
        <div className="space-y-4 text-center py-2">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">🔑</div>
           <p className="text-sm text-slate-600 leading-relaxed">
             Bạn có chắc chắn muốn đặt lại mật khẩu cho <span className="font-bold text-slate-900">{showResetModal?.name}</span>?
           </p>
           <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
             Mật khẩu tạm thời mới sẽ được gửi về email: <br/> <span className="font-bold text-indigo-600">{showResetModal?.email}</span>
           </p>
           <div className="flex flex-col gap-2 pt-4">
             <Button variant="primary" fullWidth>Gửi mật khẩu mới</Button>
             <Button variant="ghost" fullWidth onClick={() => setShowResetModal(null)}>Hủy</Button>
           </div>
        </div>
      </Modal>
    </div>
  )
}
