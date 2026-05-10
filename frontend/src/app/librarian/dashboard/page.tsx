'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function LibrarianDashboard() {
  const [showEndShiftModal, setShowEndShiftModal] = useState(false)

  // Mock data cho Dashboard
  const shiftInfo = {
    name: 'Ca Sáng',
    time: '07:00–12:00',
    librarian: 'Nguyễn Thị Lan',
  }

  const stats = [
    { label: 'Phiếu mượn', value: 12, subtext: 'hôm nay', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
    { label: 'Phiếu trả', value: 8, subtext: 'hôm nay', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    { label: 'Quá hạn', value: 3, subtext: 'cần xử lý', color: 'bg-red-50 text-red-700 ring-red-200' },
    { label: 'Phí đã thu', value: '48.000đ', subtext: 'hôm nay', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ]

  const overdueBooks = [
    { id: 1, title: 'Đắc Nhân Tâm', user: 'Trần Văn Minh', days: 6 },
    { id: 2, title: 'Nhà Giả Kim', user: 'Lê Thị Hoa', days: 2 },
  ]

  const readyReservations = [
    { id: 1, title: 'Nhà Giả Kim', user: 'Nguyễn Văn A', queue: 1 },
  ]

  const handleEndShift = () => {
    // In thực tế sẽ call API và đăng xuất
    setShowEndShiftModal(false)
    alert('Đã kết thúc ca làm việc và in tổng kết!')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan ca làm việc" description="Theo dõi và quản lý hoạt động thư viện trong ca của bạn" />

      {/* Khu vực 1 — Thanh trạng thái ca */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <Badge className="bg-primary-100 text-primary-800 text-sm px-3 py-1">
            {shiftInfo.name} ({shiftInfo.time})
          </Badge>
          <span className="text-gray-700 font-medium">Thủ thư: {shiftInfo.librarian}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowEndShiftModal(true)}>
          Kết thúc ca ▼
        </Button>
      </div>

      {/* Khu vực 2 — Stat cards (4 ô) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={cn('rounded-2xl p-5 ring-1 shadow-sm flex flex-col items-center justify-center text-center', s.color)}>
            <p className="text-sm font-medium opacity-80 mb-1">{s.label}</p>
            <p className="text-3xl font-bold mb-1">{s.value}</p>
            <p className="text-xs opacity-70">{s.subtext}</p>
          </div>
        ))}
      </div>

      {/* Khu vực 3 — Thao tác nhanh (2 nút lớn nổi bật) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/librarian/borrows/new" className="block">
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-6 shadow-glow hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📖</span> CHO MƯỢN SÁCH
              </h3>
              <p className="text-primary-100 mt-1">Quét thẻ để bắt đầu tạo phiếu mượn mới</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
        <Link href="/librarian/borrows/return" className="block">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">↩️</span> NHẬN TRẢ SÁCH
              </h3>
              <p className="text-emerald-100 mt-1">Quét mã sách để tiến hành nhận trả sách</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khu vực 4 — Danh sách sách quá hạn hôm nay */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-amber-100/80 flex items-center justify-between bg-amber-50/50 rounded-t-3xl">
            <h3 className="font-semibold text-gray-900">Sách quá hạn cần xử lý</h3>
            <Button variant="secondary" size="sm">Gửi tất cả thông báo</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {overdueBooks.map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">📕</div>
                  <div>
                    <p className="font-medium text-gray-900">{b.title}</p>
                    <p className="text-sm text-gray-500">{b.user} • <span className="text-red-600 font-medium">Quá {b.days} ngày</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Gửi nhắc</Button>
                  <Button variant="ghost" size="sm">Xem</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Khu vực 5 — Sách đặt trước vừa được trả */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-amber-100/80 bg-amber-50/50 rounded-t-3xl">
            <h3 className="font-semibold text-gray-900">Sách đặt trước đã sẵn sàng</h3>
            <p className="text-sm text-gray-500 mt-1">Cần thông báo đến độc giả nhận sách</p>
          </div>
          <div className="divide-y divide-gray-100">
            {readyReservations.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">📗</div>
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-500">→ {r.user} <span className="text-emerald-600 font-medium">(#{r.queue} hàng đợi)</span></p>
                  </div>
                </div>
                <Button variant="primary" size="sm">Thông báo</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal Kết thúc ca */}
      <Modal open={showEndShiftModal} onClose={() => setShowEndShiftModal(false)} title="Xác nhận kết thúc ca">
        <div className="space-y-4">
          <p className="text-gray-600">Bạn sắp kết thúc ca làm việc. Dưới đây là tổng kết hoạt động trong ca của bạn:</p>
          <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-200">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Số phiếu mượn đã lập:</span>
              <span className="font-medium">12 phiếu</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 py-2">
              <span className="text-gray-500">Số phiếu trả đã nhận:</span>
              <span className="font-medium">8 phiếu</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-500">Tiền phạt đã thu:</span>
              <span className="font-bold text-amber-600">48.000đ</span>
            </div>
          </div>
          <p className="text-sm text-amber-600 font-medium">Lưu ý: Hành động này sẽ in biên bản tổng kết ca và đăng xuất tài khoản của bạn khỏi thiết bị này.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowEndShiftModal(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleEndShift}>In tổng kết & Kết thúc</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
