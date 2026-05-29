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
import { Check } from 'lucide-react'

export default function LibrarianBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string>('all')
  const [editingCopy, setEditingCopy] = useState<any>(null)
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<Book | null>(null)
  
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editBookData, setEditBookData] = useState({ isbn: '', title: '', author: '', categoryId: '' })
  
  const [addingCopy, setAddingCopy] = useState(false)
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
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm sách')
    }
  }

  const handleOpenEditBook = (book: Book) => {
    setEditBookData({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      categoryId: book.category?.id?.toString() || ''
    })
    setEditingBook(book)
  }

  const handleUpdateBook = async () => {
    if (!editingBook) return
    try {
      await booksApi.update(editingBook.id, editBookData)
      toast.success('Cập nhật sách thành công')
      setEditingBook(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật sách')
    }
  }

  const handleOpenCopies = async (book: Book) => {
    try {
      const detailedBook = await booksApi.detail(book.id)
      setSelectedBookForCopies(detailedBook)
    } catch (err) {
      toast.error('Lỗi khi tải thông tin bản sao')
    }
  }

  const handleAddCopy = async () => {
    if (!selectedBookForCopies) return
    setAddingCopy(true)
    try {
      // Tự động tạo mã bản sao dựa trên ISBN và tuần tự số thứ tự
      const isbnSuffix = (selectedBookForCopies.isbn || '0000').slice(-4)
      const existingSeqs = selectedBookForCopies.copies?.map((c: any) => parseInt(c.copyCode?.split('-')?.pop() || '0')) || []
      const maxSeq = Math.max(0, ...existingSeqs.filter(n => !isNaN(n)))
      const nextSeq = maxSeq + 1
      const copyCode = `${isbnSuffix}-${String(nextSeq).padStart(3, '0')}`
      
      await booksApi.createCopy(selectedBookForCopies.id, { copyCode, condition: 'new', status: 'available' })
      
      // Refresh detailed book
      const detailedBook = await booksApi.detail(selectedBookForCopies.id)
      setSelectedBookForCopies(detailedBook)
      loadData() // Refresh list to update available copies count
      toast.success('Đã thêm bản sao mới')
    } catch (err) {
      toast.error('Lỗi khi thêm bản sao')
    } finally {
      setAddingCopy(false)
    }
  }

  const handleUpdateCopy = async () => {
    if (!editingCopy) return
    try {
      await booksApi.updateCopy(editingCopy.id, {
        condition: editingCopy.condition,
        status: editingCopy.status
      })
      toast.success('Cập nhật bản sao thành công')
      setEditingCopy(null)
      // Refresh detailed book
      if (selectedBookForCopies) {
        const detailedBook = await booksApi.detail(selectedBookForCopies.id)
        setSelectedBookForCopies(detailedBook)
        loadData() // Refresh list to update available copies count
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật bản sao')
    }
  }

  const handleDeleteCopy = async (copyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản sao này? Hành động này không thể hoàn tác.')) return
    try {
      await booksApi.deleteCopy(copyId)
      toast.success('Đã xóa bản sao thành công')
      setEditingCopy(null)
      
      // Optimistic update for the copies modal
      if (selectedBookForCopies) {
        setSelectedBookForCopies({
          ...selectedBookForCopies,
          copies: selectedBookForCopies.copies?.filter(c => c.id !== copyId)
        })
        loadData() // Refresh background list to update available copies count
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa bản sao')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý sách & Kho" description="Quản lý các đầu sách và bản sao vật lý trong thư viện" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full sm:w-auto overflow-x-auto scrollbar-hide px-1 pb-2 pt-1">
          <Input 
            placeholder="Tìm sách..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-[160px] sm:max-w-xs rounded-xl sm:rounded-2xl text-xs sm:text-sm"
          />
          <Select 
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="rounded-xl sm:rounded-2xl text-xs sm:text-sm shrink-0"
          >
            <option value="all">Tất cả thể loại</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowAddBookModal(true)} className="rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap shrink-0">
          + Thêm sách
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
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditBook(book)} className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Sửa</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenCopies(book)} className="rounded-full px-4">Bản sao</Button>
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
            <Button variant="primary" size="sm" className="rounded-xl" onClick={handleAddCopy} loading={addingCopy}>+ Thêm bản sao</Button>
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
                      {copy.status === 'available' ? <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold"><Check className="w-3 h-3 inline mr-0.5" /> Có sẵn</Badge> : 
                       copy.status === 'borrowed' ? <Badge className="bg-blue-50 text-blue-600 border-none font-bold"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />Đang mượn</Badge> :
                       <Badge className="bg-gray-100 text-gray-500 border-none">Mất/Thanh lý</Badge>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {copy.status !== 'borrowed' ? (
                        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditingCopy(copy)}>Sửa</Button>
                      ) : (
                        <span className="text-xs text-gray-400 italic px-3">Đang mượn</span>
                      )}
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

      {/* Modal Cập Nhật Bản Sao */}
      <Modal open={!!editingCopy} onClose={() => setEditingCopy(null)} title="Cập nhật bản sao" size="sm">
         <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mã bản sao:</p>
               <p className="text-lg font-black text-gray-800 font-mono mt-0.5">{editingCopy?.copyCode}</p>
            </div>
            
            <div className="space-y-3">
               <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Tình trạng vật lý</label>
                  <Select 
                    className="w-full rounded-xl"
                    value={editingCopy?.condition}
                    onChange={e => setEditingCopy({...editingCopy, condition: e.target.value})}
                  >
                     <option value="new">Mới (New)</option>
                     <option value="good">Tốt (Good)</option>
                     <option value="fair">Khá (Fair)</option>
                     <option value="poor">Kém/Cũ (Poor)</option>
                  </Select>
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Trạng thái lưu trữ</label>
                  <Select 
                    className="w-full rounded-xl"
                    value={editingCopy?.status}
                    onChange={e => setEditingCopy({...editingCopy, status: e.target.value})}
                  >
                     <option value="available">Có sẵn</option>
                     <option value="lost">Đã mất</option>
                     <option value="damaged">Thanh lý (Damaged)</option>
                  </Select>
               </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
               <Button variant="primary" fullWidth onClick={handleUpdateCopy}>Lưu thay đổi</Button>
               <Button variant="ghost" fullWidth onClick={() => setEditingCopy(null)}>Hủy bỏ</Button>
               <div className="border-t border-gray-100 my-2 pt-2">
                  <Button variant="ghost" fullWidth className="text-red-600 hover:bg-red-50 font-bold" onClick={() => handleDeleteCopy(editingCopy.id)}>Xóa bản sao này</Button>
               </div>
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

      {/* Modal Cập Nhật Thông Tin Sách */}
      <Modal open={!!editingBook} onClose={() => setEditingBook(null)} title="Cập nhật Thông tin Sách" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mã ISBN</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    placeholder="Quét hoặc nhập ISBN..." 
                    className="flex-1 rounded-2xl" 
                    value={editBookData.isbn}
                    onChange={e => setEditBookData({...editBookData, isbn: e.target.value})}
                  />
                  <Button variant="secondary" className="rounded-2xl px-4">Tra cứu</Button>
                </div>
             </div>
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tên sách</label>
                <Input 
                  className="mt-1 rounded-2xl" 
                  placeholder="Nhập tên sách đầy đủ" 
                  value={editBookData.title}
                  onChange={e => setEditBookData({...editBookData, title: e.target.value})}
                />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tác giả</label>
                <Input 
                  className="mt-1 rounded-2xl" 
                  placeholder="Tên tác giả" 
                  value={editBookData.author}
                  onChange={e => setEditBookData({...editBookData, author: e.target.value})}
                />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Thể loại</label>
                <Select 
                  className="mt-1 rounded-2xl"
                  value={editBookData.categoryId}
                  onChange={e => setEditBookData({...editBookData, categoryId: e.target.value})}
                >
                  <option value="">Chọn thể loại</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setEditingBook(null)}>Hủy bỏ</Button>
            <Button variant="primary" onClick={handleUpdateBook} className="rounded-2xl px-8">Lưu thay đổi</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
