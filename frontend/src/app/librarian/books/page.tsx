'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { booksApi, categoriesApi } from '@/lib/api'
import { Book, Category } from '@/types'
import { toast } from 'react-hot-toast'

export default function LibrarianBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string>('all')
  
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<Book | null>(null)
  const [showAddBookModal, setShowAddBookModal] = useState(false)
  const [newBook, setNewBook] = useState({ isbn: '', title: '', author: '', categoryId: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [booksRes, catsRes] = await Promise.all([
        booksApi.getAll({ 
          page, 
          search: search || undefined, 
          categoryId: categoryId === 'all' ? undefined : parseInt(categoryId) 
        }),
        categoriesApi.getAll()
      ])
      setBooks(booksRes.data)
      setTotal(booksRes.total)
      setCategories(catsRes)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách sách')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddBook = async () => {
    try {
      await booksApi.create(newBook)
      toast.success('Thêm sách mới thành công')
      setShowAddBookModal(false)
      loadData()
    } catch (err) {
      toast.error('Lỗi khi thêm sách')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý sách & Kho" description="Quản lý các đầu sách và bản sao vật lý trong thư viện" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="🔍 Tìm sách theo tên, ISBN..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs rounded-2xl"
          />
          <Select 
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="rounded-2xl"
          >
            <option value="all">Tất cả thể loại</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowAddBookModal(true)} className="rounded-2xl px-6">
          + Thêm sách mới
        </Button>
      </div>

      {/* Main Table */}
      <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-5 px-6">ISBN</th>
                <th className="py-5 px-6">Tên sách</th>
                <th className="py-5 px-6">Tác giả</th>
                <th className="py-5 px-6">Thể loại</th>
                <th className="py-5 px-6">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 italic">Không tìm thấy sách</td></tr>
              ) : books.map(book => (
                <tr key={book.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6 text-xs font-mono text-gray-400">{book.isbn || '---'}</td>
                  <td className="py-4 px-6 font-bold text-gray-800 text-sm">{book.title}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{book.author}</td>
                  <td className="py-4 px-6 text-xs text-gray-500">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none font-medium">
                      {book.category?.name || 'Chưa phân loại'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {book.availableCopies > 0 ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">
                        {book.availableCopies}/{book.totalCopies} Có sẵn
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-600 border-red-100 font-bold">
                        Hết sách
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Sửa</Button>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedBookForCopies(book)} className="rounded-full px-4">Bản sao</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-50 flex justify-between items-center bg-white">
          <p className="text-xs text-gray-400 font-medium italic">Hiển thị {books.length} / {total} đầu sách</p>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
             <Button variant="ghost" size="sm" disabled={books.length < 20} onClick={() => setPage(p => p + 1)}>Sau</Button>
          </div>
        </div>
      </Card>

      {/* Modal Quản lý Bản Sao */}
      <Modal open={!!selectedBookForCopies} onClose={() => setSelectedBookForCopies(null)} title={`Kho sách — ${selectedBookForCopies?.title}`} size="lg">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Danh sách các cuốn vật lý của đầu sách này hiện có trong kho.</p>
            <Button variant="primary" size="sm" className="rounded-xl">+ Thêm bản sao</Button>
          </div>
          <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Mã BC</th>
                  <th className="py-4 px-6">Tình trạng</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {selectedBookForCopies?.copies?.map(copy => (
                  <tr key={copy.id} className="hover:bg-gray-50/20">
                    <td className="py-4 px-6 font-mono font-bold text-gray-800">{copy.copyCode}</td>
                    <td className="py-4 px-6 text-gray-500 capitalize">{copy.condition}</td>
                    <td className="py-4 px-6">
                      {copy.status === 'available' ? <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">✓ Có sẵn</Badge> : 
                       copy.status === 'borrowed' ? <Badge className="bg-blue-50 text-blue-600 border-none font-bold italic">📖 Đang mượn</Badge> :
                       <Badge className="bg-gray-100 text-gray-500 border-none">Mất/Thanh lý</Badge>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm" className="rounded-full">Sửa</Button>
                    </td>
                  </tr>
                ))}
                {(!selectedBookForCopies?.copies || selectedBookForCopies.copies.length === 0) && (
                   <tr><td colSpan={4} className="py-10 text-center text-gray-400 italic text-sm">Chưa có bản sao nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Thêm Sách Mới */}
      <Modal open={showAddBookModal} onClose={() => setShowAddBookModal(false)} title="Nhập Sách Mới" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mã ISBN</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    placeholder="Quét hoặc nhập ISBN..." 
                    className="flex-1 rounded-2xl" 
                    value={newBook.isbn}
                    onChange={e => setNewBook({...newBook, isbn: e.target.value})}
                  />
                  <Button variant="secondary" className="rounded-2xl px-4">Tra cứu</Button>
                </div>
             </div>
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tên sách</label>
                <Input 
                  className="mt-1 rounded-2xl" 
                  placeholder="Nhập tên sách đầy đủ" 
                  value={newBook.title}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tác giả</label>
                <Input 
                  className="mt-1 rounded-2xl" 
                  placeholder="Tên tác giả" 
                  value={newBook.author}
                  onChange={e => setNewBook({...newBook, author: e.target.value})}
                />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Thể loại</label>
                <Select 
                  className="mt-1 rounded-2xl"
                  value={newBook.categoryId}
                  onChange={e => setNewBook({...newBook, categoryId: e.target.value})}
                >
                  <option value="">Chọn thể loại</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setShowAddBookModal(false)}>Hủy bỏ</Button>
            <Button variant="primary" onClick={handleAddBook} className="rounded-2xl px-8">Lưu sách</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
