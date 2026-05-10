'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'

// Mock Data
const MOCK_BOOKS = [
  { id: '1', isbn: '978-604-1-09', title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', total: 5, available: 3 },
  { id: '2', isbn: '978-604-2-12', title: 'Nhà Giả Kim', author: 'Paulo Coelho', total: 4, available: 0 },
]

const MOCK_COPIES = [
  { copyCode: '3901-001', condition: 'good', status: 'available' },
  { copyCode: '3901-002', condition: 'fair', status: 'borrowed' },
  { copyCode: '3901-003', condition: 'good', status: 'available' },
  { copyCode: '3901-004', condition: 'lost', status: 'lost' },
]

export default function LibrarianBooksPage() {
  const [search, setSearch] = useState('')
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<typeof MOCK_BOOKS[0] | null>(null)
  const [showAddBookModal, setShowAddBookModal] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý sách & Kho" description="Quản lý các đầu sách và bản sao vật lý trong thư viện" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="🔍 Tìm sách theo tên, ISBN..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select 
            value="all"
            onChange={() => {}}
          >
            <option value="all">Tất cả thể loại</option>
            <option value="psychology">Tâm lý học</option>
            <option value="novel">Tiểu thuyết</option>
          </Select>
          <Select 
            value="all"
            onChange={() => {}}
          >
            <option value="all">Tất cả tình trạng</option>
            <option value="available">Có sẵn</option>
            <option value="unavailable">Hết sách</option>
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowAddBookModal(true)}>+ Thêm sách mới</Button>
      </div>

      {/* Main Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">ISBN</th>
                <th className="py-4 px-6 font-medium">Tên sách</th>
                <th className="py-4 px-6 font-medium">Tác giả</th>
                <th className="py-4 px-6 font-medium">Bản sao</th>
                <th className="py-4 px-6 font-medium">Có sẵn</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_BOOKS.map(book => (
                <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-600">{book.isbn}</td>
                  <td className="py-4 px-6 font-medium text-gray-900">{book.title}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{book.author}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{book.total}</td>
                  <td className="py-4 px-6">
                    {book.available > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-800">{book.available}/{book.total}</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">0/{book.total} ❌</Badge>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Button variant="ghost" size="sm">Sửa</Button>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedBookForCopies(book)}>Bản sao</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Quản lý Bản Sao */}
      <Modal open={!!selectedBookForCopies} onClose={() => setSelectedBookForCopies(null)} title={`Quản lý bản sao — ${selectedBookForCopies?.title}`} size="lg">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Danh sách các cuốn vật lý của đầu sách này.</p>
            <Button variant="primary" size="sm">+ Thêm bản sao</Button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-3 px-4 font-medium">Mã BC</th>
                  <th className="py-3 px-4 font-medium">Tình trạng</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MOCK_COPIES.map(copy => (
                  <tr key={copy.copyCode}>
                    <td className="py-3 px-4 font-medium text-gray-900">{copy.copyCode}</td>
                    <td className="py-3 px-4">
                      {copy.condition === 'good' ? 'Tốt' : copy.condition === 'fair' ? 'Cũ/Hư nhẹ' : copy.condition === 'lost' ? 'Mất' : 'Hư hỏng'}
                    </td>
                    <td className="py-3 px-4">
                      {copy.status === 'available' ? <Badge className="bg-emerald-100 text-emerald-800">✅ Có sẵn</Badge> : 
                       copy.status === 'borrowed' ? <Badge className="bg-blue-100 text-blue-800">📖 Đang mượn</Badge> :
                       <Badge className="bg-gray-100 text-gray-800">❌ Mất/Thanh lý</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {copy.status === 'borrowed' || copy.status === 'lost' ? (
                        <span className="text-gray-400 italic text-xs">Không thể sửa</span>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm">Sửa</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">Thanh lý</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Thêm Sách Mới */}
      <Modal open={showAddBookModal} onClose={() => setShowAddBookModal(false)} title="Thêm Sách Mới" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex gap-2">
              <Input placeholder="Nhập ISBN..." className="flex-1" />
              <Button variant="secondary">Tự động điền</Button>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Tên sách</label>
              <Input className="mt-1" placeholder="Nhập tên sách" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tác giả</label>
              <Input className="mt-1" placeholder="Tác giả" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nhà xuất bản</label>
              <Input className="mt-1" placeholder="Nhà xuất bản" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowAddBookModal(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => setShowAddBookModal(false)}>Lưu & Thêm</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
