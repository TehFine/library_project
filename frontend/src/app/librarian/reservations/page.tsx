'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { librarianApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function LibrarianReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await librarianApi.getReservations()
      // Filter logic in frontend for now as backend findAll is simple
      let filtered = res
      if (status !== 'all') {
        filtered = filtered.filter((r: any) => r.status === status)
      }
      if (search) {
        filtered = filtered.filter((r: any) => 
          r.book?.title.toLowerCase().includes(search.toLowerCase()) || 
          (r.libraryCard?.user?.fullName || r.libraryCard?.user?.username).toLowerCase().includes(search.toLowerCase())
        )
      }
      setReservations(filtered)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đặt trước')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFulfill = async (id: string) => {
    try {
      await librarianApi.fulfillReservation(id)
      toast.success('Đã cấp sách thành công cho độc giả đặt trước')
      setSelectedReservation(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cấp sách')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý đặt trước" description="Theo dõi và thông báo cho độc giả khi sách có sẵn" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="🔍 Tìm theo tên sách, tên độc giả..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs rounded-2xl"
          />
          <Select 
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-2xl"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="waiting">Chờ có sách (Waiting)</option>
            <option value="notified">Chờ đến nhận (Ready)</option>
            <option value="completed">Đã hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-5 px-6">Sách</th>
                <th className="py-5 px-6">Người dùng</th>
                <th className="py-5 px-6">Ngày đặt</th>
                <th className="py-5 px-6">Vị trí</th>
                <th className="py-5 px-6">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Không có yêu cầu đặt trước nào</td></tr>
              ) : reservations.map(res => (
                <tr key={res.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-amber-50 text-amber-600 rounded flex items-center justify-center font-bold">📖</div>
                      <span className="font-bold text-gray-800 text-sm">{res.book?.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{res.libraryCard?.user?.fullName || res.libraryCard?.user?.username}</span>
                      <span className="text-[10px] text-gray-400 tracking-tighter">Thẻ: {res.libraryCard?.cardNumber}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                    {new Date(res.reservedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">
                      Hàng đợi #{res.queuePosition}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={cn(
                      'border-none font-bold',
                      res.status === 'notified' ? 'bg-emerald-50 text-emerald-600' : 
                      res.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                      res.status === 'waiting' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'
                    )}>
                      {res.status === 'waiting' ? '● Chờ có sách' : 
                       res.status === 'notified' ? '● Chờ đến nhận' : 
                       res.status === 'completed' ? '● Đã hoàn tất' : '● ' + res.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {res.status === 'notified' && (
                      <Button variant="primary" size="sm" className="rounded-full px-4" onClick={() => handleFulfill(res.id)}>Cấp Sách</Button>
                    )}
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setSelectedReservation(res)}>Chi tiết</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Chi Tiết Đặt Trước */}
      <Modal open={!!selectedReservation} onClose={() => setSelectedReservation(null)} title="Chi tiết đặt trước" size="md">
        <div className="space-y-6">
           <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center space-y-2">
              <div className="w-16 h-16 bg-white border border-blue-200 text-blue-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm mb-4">📖</div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sách đặt trước</p>
              <p className="text-xl font-black text-gray-900 leading-tight">{selectedReservation?.book?.title}</p>
           </div>
           
           <div className="space-y-4 text-sm px-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Trạng thái</span>
                <Badge className={cn(
                  'border-none font-bold',
                  selectedReservation?.status === 'notified' ? 'bg-emerald-50 text-emerald-600' : 
                  selectedReservation?.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                  selectedReservation?.status === 'waiting' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'
                )}>
                  {selectedReservation?.status === 'waiting' ? '● Chờ có sách' : 
                   selectedReservation?.status === 'notified' ? '● Chờ đến nhận' : 
                   selectedReservation?.status === 'completed' ? '● Đã hoàn tất' : '● ' + selectedReservation?.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Người dùng</span>
                <span className="font-bold text-gray-900">{selectedReservation?.libraryCard?.user?.fullName || selectedReservation?.libraryCard?.user?.username}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Liên hệ (SĐT)</span>
                <span className="font-bold text-gray-900">{selectedReservation?.libraryCard?.user?.phone || '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Ngày đặt</span>
                <span className="font-bold text-gray-900">{selectedReservation?.reservedAt ? new Date(selectedReservation.reservedAt).toLocaleString('vi-VN') : '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Vị trí hàng đợi</span>
                <span className="font-bold text-blue-600 text-lg">#{selectedReservation?.queuePosition}</span>
              </div>
           </div>

           <div className="pt-4 border-t border-gray-50 flex justify-center gap-3">
              <Button variant="secondary" className="rounded-2xl px-8" onClick={() => setSelectedReservation(null)}>Đóng</Button>
           </div>
        </div>
      </Modal>
    </div>
  )
}
