'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { adminApi, Shift } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Clock, Plus, Trash2, User, Calendar, AlertCircle } from 'lucide-react'

interface UserOption {
  id: string
  username: string
  fullName: string | null
  role: string
}

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [newShift, setNewShift] = useState({
    librarianId: '',
    startDate: '',
    startTime: '07:00',
    endDate: '',
    endTime: '12:00',
    note: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [shiftsData, usersData] = await Promise.all([
        adminApi.getShifts(),
        adminApi.getAllUsers(),
      ])
      setShifts(shiftsData)
      // Filter only librarians
      setUsers(usersData.filter(u => u.role === 'librarian') as UserOption[])
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu ca trực')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateShift = async () => {
    if (!newShift.librarianId || !newShift.startDate || !newShift.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    setIsCreating(true)
    try {
      await adminApi.createShift({
        librarianId: newShift.librarianId,
        startTime: `${newShift.startDate}T${newShift.startTime}:00`,
        endTime: `${newShift.endDate}T${newShift.endTime}:00`,
        note: newShift.note || undefined,
      })
      toast.success('Đã tạo ca trực mới')
      setShowCreateModal(false)
      setNewShift({ librarianId: '', startDate: '', startTime: '07:00', endDate: '', endTime: '12:00', note: '' })
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi tạo ca trực')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ca trực này?')) return
    setDeletingId(id)
    try {
      await adminApi.deleteShift(id)
      toast.success('Đã xóa ca trực')
      setShifts(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi xóa ca trực')
    } finally {
      setDeletingId(null)
    }
  }

  const getShiftStatus = (shift: Shift) => {
    const now = new Date()
    const start = new Date(shift.startTime)
    const end = new Date(shift.endTime)

    if (now >= start && now <= end) return { label: 'Đang diễn ra', color: 'bg-emerald-50 text-emerald-600' }
    if (now < start) return { label: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-600' }
    return { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-500' }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý ca trực" description="Phân ca cho thủ thư và theo dõi lịch trực" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Tổng số ca: <strong className="text-gray-800">{shifts.length}</strong></span>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap shrink-0">
          <Plus className="w-4 h-4" />
          <span>Thêm ca trực</span>
        </Button>
      </div>

      {/* Shifts List */}
      <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-5 px-6">Thủ thư</th>
                <th className="py-5 px-6">Giờ vào</th>
                <th className="py-5 px-6">Giờ ra</th>
                <th className="py-5 px-6">Ghi chú</th>
                <th className="py-5 px-6">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <Clock className="w-7 h-7 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Chưa có ca trực nào</p>
                        <p className="text-gray-300 text-xs mt-1">Thêm ca trực để bắt đầu phân công thủ thư</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : shifts.map(shift => {
                const status = getShiftStatus(shift)
                return (
                  <tr key={shift.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 text-sm">
                            {shift.librarian?.fullName || shift.librarian?.username || 'Đã xóa'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(shift.startTime).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(shift.endTime).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 italic">
                      {shift.note || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={status.color + ' border-none font-bold'}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteShift(shift.id)}
                        loading={deletingId === shift.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Shift Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Thêm ca trực mới" size="md">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Chọn thủ thư</label>
            <Select
              className="w-full rounded-2xl"
              value={newShift.librarianId}
              onChange={e => setNewShift({ ...newShift, librarianId: e.target.value })}
            >
              <option value="">-- Chọn thủ thư --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
              <Input
                type="date"
                className="rounded-2xl"
                value={newShift.startDate}
                onChange={e => setNewShift({ ...newShift, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Giờ bắt đầu</label>
              <Input
                type="time"
                className="rounded-2xl"
                value={newShift.startTime}
                onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
              <Input
                type="date"
                className="rounded-2xl"
                value={newShift.endDate}
                onChange={e => setNewShift({ ...newShift, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Giờ kết thúc</label>
              <Input
                type="time"
                className="rounded-2xl"
                value={newShift.endTime}
                onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Ghi chú (tùy chọn)</label>
            <Input
              placeholder="Ghi chú cho ca trực..."
              className="rounded-2xl"
              value={newShift.note}
              onChange={e => setNewShift({ ...newShift, note: e.target.value })}
            />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">Lưu ý</p>
              <p className="text-xs mt-1">Chỉ thủ thư đang trong ca trực mới có thể duyệt yêu cầu mượn, nhận trả sách, thu phí và xem dashboard. Admin luôn có quyền truy cập.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Hủy</Button>
            <Button variant="primary" className="rounded-2xl px-8" onClick={handleCreateShift} loading={isCreating}>
              Tạo ca trực
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
