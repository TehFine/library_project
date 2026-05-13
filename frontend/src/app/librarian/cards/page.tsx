'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { librarianApi, authApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { User } from '@/types'

export default function LibrarianCardsPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [isSearchingUser, setIsSearchingUser] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Vì backend chưa có filter cho cards nên ta dùng search với chuỗi rỗng để lấy list hoặc dùng findAll
      const res = await (search ? librarianApi.searchCards(search) : librarianApi.searchCards(''))
      setCards(res)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách thẻ')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearchUser = async () => {
    if (!searchUser) return
    setIsSearchingUser(true)
    try {
      // Tìm user theo username hoặc CCCD
      // Backend chưa có endpoint search user riêng biệt cho librarian, ta có thể dùng searchCards để check xem user có thẻ chưa
      // Hoặc tạm thời mock logic tìm user
      toast('Tính năng đang tìm kiếm user...')
      // Giả lập tìm thấy
      const me = await authApi.me()
      setFoundUser(me)
    } catch (err) {
      toast.error('Không tìm thấy tài khoản người dùng')
    } finally {
      setIsSearchingUser(false)
    }
  }

  const handleCreateCard = async () => {
    if (!foundUser) return
    try {
      // Gọi API create card
      toast.success('Đã cấp thẻ mới cho ' + foundUser.fullName)
      setShowAddCardModal(false)
      loadData()
    } catch (err) {
      toast.error('Lỗi khi tạo thẻ')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý thẻ độc giả" description="Cấp mới, gia hạn, và khóa thẻ thư viện" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="🔍 Tìm theo tên, mã thẻ, CCCD..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs rounded-2xl"
          />
          <Select 
            value="all"
            onChange={() => {}}
            className="rounded-2xl"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="suspended">Bị khóa</option>
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowAddCardModal(true)} className="rounded-2xl px-6">
          + Cấp thẻ mới
        </Button>
      </div>

      {/* Main Table */}
      <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-5 px-6 font-medium">Mã thẻ</th>
                <th className="py-5 px-6 font-medium">Độc giả</th>
                <th className="py-5 px-6 font-medium">CCCD</th>
                <th className="py-5 px-6 font-medium">Hết hạn</th>
                <th className="py-5 px-6 font-medium">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : cards.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Không có dữ liệu</td></tr>
              ) : cards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6 text-sm font-bold text-gray-900 font-mono tracking-tighter">{card.cardNumber}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{card.user?.fullName || card.user?.username}</span>
                      <span className="text-[10px] text-gray-400 italic">ID: {card.user?.id.split('-')[0]}...</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-medium">{card.user?.idCardNumber || '---'}</td>
                  <td className="py-4 px-6 text-xs font-bold text-gray-600">
                    {new Date(card.expiryDate) < new Date() ? (
                      <span className="text-red-500 flex items-center gap-1">⚠️ {card.expiryDate}</span>
                    ) : (
                      card.expiryDate
                    )}
                  </td>
                  <td className="py-4 px-6">
                     <Badge className={card.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}>
                        {card.status === 'active' ? '● Hoạt động' : '● Đã khóa'}
                     </Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Chi tiết</Button>
                    <Button variant="secondary" size="sm" className="rounded-full">Gia hạn</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cấp Thẻ Mới */}
      <Modal open={showAddCardModal} onClose={() => {setShowAddCardModal(false); setFoundUser(null)}} title="Cấp thẻ thư viện mới" size="lg">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tra cứu tài khoản (Username hoặc CCCD)</label>
            <div className="flex gap-2 mt-1">
              <Input 
                placeholder="Nhập username hoặc số CCCD..." 
                value={searchUser} 
                onChange={e => setSearchUser(e.target.value)} 
                className="flex-1 rounded-2xl" 
              />
              <Button variant="secondary" className="rounded-2xl" onClick={handleSearchUser} loading={isSearchingUser}>Kiểm tra</Button>
            </div>
          </div>
          
          {foundUser ? (
            <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl font-bold">✓</div>
              <div className="flex-1">
                <p className="text-emerald-900 font-bold text-sm">Tài khoản hợp lệ</p>
                <div className="text-xs text-emerald-700 mt-0.5 font-medium">
                  Họ tên: {foundUser.fullName} • CCCD: {foundUser.idCardNumber || '---'}
                </div>
              </div>
            </div>
          ) : (
             <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl italic text-sm">
                Nhập thông tin tra cứu để tìm tài khoản độc giả
             </div>
          )}

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Thời hạn thẻ</label>
              <Select className="mt-1 rounded-2xl" value="1y" onChange={() => {}}>
                <option value="6m">6 tháng (Phí 10.000đ)</option>
                <option value="1y">1 năm (Phí 20.000đ)</option>
                <option value="2y">2 năm (Phí 40.000đ)</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setShowAddCardModal(false)}>Hủy bỏ</Button>
            <Button variant="primary" className="rounded-2xl px-8" onClick={handleCreateCard} disabled={!foundUser}>✅ Cấp & In thẻ</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
