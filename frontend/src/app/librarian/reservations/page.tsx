'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Button from '@/components/ui/Button'

// Mock Data
const MOCK_RESERVATIONS = [
  {
    bookId: '1',
    bookTitle: 'Nhà Giả Kim',
    queue: [
      { id: 'R-001', reader: 'Trần Văn Minh', date: '07/05/2026', status: 'waiting' },
      { id: 'R-002', reader: 'Lê Thị Hoa', date: '08/05/2026', status: 'waiting' },
      { id: 'R-003', reader: 'Nguyễn Văn C', date: '09/05/2026', status: 'waiting' },
    ]
  },
  {
    bookId: '2',
    bookTitle: 'Sapiens',
    queue: [
      { id: 'R-004', reader: 'Phạm Thị D', date: '06/05/2026', status: 'notified' },
    ]
  }
]

export default function LibrarianReservationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Đặt trước" description="Theo dõi hàng đợi và thông báo khi có sách" />

      <div className="space-y-6">
        {MOCK_RESERVATIONS.map(group => (
          <Card key={group.bookId} padding="none">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">{group.bookTitle} <span className="text-sm font-normal text-gray-500 ml-2">• {group.queue.length} người đang chờ</span></h3>
            </div>
            <div className="divide-y divide-gray-100">
              {group.queue.map((res, index) => (
                <div key={res.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-primary text-white shadow-glow' : 'bg-gray-100 text-gray-500'}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{res.reader}</p>
                      <p className="text-sm text-gray-500">
                        {res.status === 'waiting' ? '⏳ Đang chờ' : '✅ Đã thông báo'} • Đặt lúc: {res.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {index === 0 && res.status === 'waiting' && (
                      <Button variant="primary" size="sm">Thông báo có sách</Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">Hủy đặt</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
