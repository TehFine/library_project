'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { librarianApi, cardsApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { User } from '@/types'
import { TriangleAlert, Check, CreditCard, X, IdCard } from 'lucide-react'
import { cardStatusMap } from '@/lib/utils'

const cardDotColors: Record<string, string> = {
  active: 'bg-emerald-500',
  expired: 'bg-yellow-500',
  suspended: 'bg-red-500',
  locked: 'bg-red-500',
  cancelled: 'bg-gray-400',
  pending: 'bg-amber-500',
  rejected: 'bg-red-500',
}

export default function LibrarianCardsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all')
  const [cards, setCards] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPending, setLoadingPending] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [isSearchingUser, setIsSearchingUser] = useState(false)
  const [duration, setDuration] = useState('1y')
  const [renewing, setRenewing] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<any | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await (search ? librarianApi.searchCards(search) : librarianApi.searchCards(''))
      const filtered = filterStatus !== 'all' 
        ? res.filter((c: any) => c.status === filterStatus)
        : res
      setCards(filtered)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách thẻ')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus])

  const loadPendingRequests = useCallback(async () => {
    setLoadingPending(true)
    try {
      const res = await cardsApi.getPendingActivations()
      setPendingRequests(res)
    } catch (err) {
      // Silent fail for pending requests
    } finally {
      setLoadingPending(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'all') {
      loadData()
    } else {
      loadPendingRequests()
    }
  }, [activeTab, loadData, loadPendingRequests])

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    try {
      await cardsApi.approveActivation(id)
      toast.success('Đã duyệt cấp thẻ thành công')
      loadPendingRequests()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi duyệt thẻ')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setApprovingId(id)
    try {
      await cardsApi.rejectActivation(id)
      toast.success('Đã từ chối yêu cầu cấp thẻ')
      loadPendingRequests()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi từ chối')
    } finally {
      setApprovingId(null)
    }
  }

  const handleSearchUser = async () => {
    if (!searchUser) return
    setIsSearchingUser(true)
    setFoundUser(null)
    try {
      const users = await librarianApi.searchUsers(searchUser)
      if (users && users.length > 0) {
        setFoundUser(users[0])
      } else {
        toast.error('Không tìm thấy tài khoản người dùng')
      }
    } catch (err) {
      toast.error('Lỗi khi tra cứu người dùng')
    } finally {
      setIsSearchingUser(false)
    }
  }

  const handleCreateCard = async () => {
    if (!foundUser) return
    try {
      await librarianApi.createCard(foundUser.id, duration)
      toast.success('Đã cấp thẻ mới cho ' + foundUser.fullName)
      setShowAddCardModal(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo thẻ')
    }
  }

  const handleRenewCard = async (cardId: string) => {
    setRenewing(cardId)
    try {
      await librarianApi.renewCard(cardId, '1y')
      toast.success('Gia hạn thẻ thành công')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gia hạn thẻ')
    } finally {
      setRenewing(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý thẻ độc giả" description="Cấp mới, gia hạn, và khóa thẻ thư viện" />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-50/80 rounded-2xl p-1 w-fit border border-slate-100">
        <button onClick={() => setActiveTab('all')} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Tất cả thẻ</button>
        <button onClick={() => setActiveTab('pending')} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Yêu cầu cấp mới
          {pendingRequests.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'pending' ? (
        /* Pending Activation Requests */
        <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/50 border-b border-amber-100 text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                  <th className="py-5 px-6 font-medium">Độc giả</th>
                  <th className="py-5 px-6 font-medium">Email</th>
                  <th className="py-5 px-6 font-medium">CCCD</th>
                  <th className="py-5 px-6 font-medium">Yêu cầu lúc</th>
                  <th className="py-5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {loadingPending ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="py-4 px-6">
                          <div className="h-4 bg-amber-100/60 rounded animate-pulse" style={{ width: j === 4 ? '40%' : j === 3 ? '50%' : '70%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                          <IdCard className="w-7 h-7 text-amber-300" />
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium">Không có yêu cầu cấp thẻ mới</p>
                          <p className="text-gray-300 text-xs mt-1">Độc giả gửi yêu cầu cấp thẻ sẽ hiển thị tại đây</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : pendingRequests.map(card => (
                  <tr key={card.id} className="hover:bg-amber-50/20 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">{card.user?.profile?.fullName || card.user?.fullName || card.user?.username}</span>
                        <span className="text-[10px] text-gray-400 italic">@{card.user?.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">{card.user?.email || '---'}</td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-medium">{card.user?.idCardNumber || '---'}</td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {new Date(card.createdAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Button 
                        variant="primary" size="sm" className="rounded-full" 
                        loading={approvingId === card.id}
                        onClick={() => handleApprove(card.id)}
                      >
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </Button>
                      <Button 
                        variant="ghost" size="sm" className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                        loading={approvingId === card.id}
                        onClick={() => handleReject(card.id)}
                      >
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-50">
            <div className="flex gap-2 sm:gap-3 flex-1 w-full sm:w-auto overflow-x-auto scrollbar-hide px-1 pb-2 pt-1">
              <Input 
                placeholder="Tìm thẻ..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-[150px] sm:max-w-xs rounded-xl sm:rounded-2xl text-xs sm:text-sm"
              />
              <Select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="rounded-xl sm:rounded-2xl text-xs sm:text-sm shrink-0"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="expired">Hết hạn</option>
                <option value="suspended">Bị khóa</option>
                <option value="pending">Chờ duyệt</option>
                <option value="cancelled">Đã hủy</option>
                <option value="rejected">Bị từ chối</option>
              </Select>
            </div>
            <Button variant="primary" onClick={() => setShowAddCardModal(true)} className="rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap shrink-0">
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
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="py-4 px-6">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '55%' : j === 4 ? '45%' : j === 5 ? '40%' : '70%' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : cards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                            <CreditCard className="w-7 h-7 text-gray-300" />
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium">Không có dữ liệu thẻ</p>
                            <p className="text-gray-300 text-xs mt-1">Danh sách thẻ thư viện sẽ hiển thị tại đây</p>
                          </div>
                        </div>
                      </td>
                    </tr>
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
                          <span className="text-red-500 flex items-center gap-1"><TriangleAlert className="w-3.5 h-3.5" /> {card.expiryDate}</span>
                        ) : (
                          card.expiryDate
                        )}
                      </td>
                      <td className="py-4 px-6">
                         <Badge className={(cardStatusMap[card.status]?.color || 'bg-gray-100 text-gray-500')}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cardDotColors[card.status] || 'bg-gray-400'}`} />{cardStatusMap[card.status]?.label || card.status}
                         </Badge>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Button variant="ghost" size="sm" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedCard(card)}>Chi tiết</Button>
                        {(card.status === 'active' || card.status === 'expired') && (
                          <Button variant="secondary" size="sm" className="rounded-full" loading={renewing === card.id} onClick={() => handleRenewCard(card.id)}>Gia hạn</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

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
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl font-bold"><Check className="w-6 h-6" /></div>
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
              <Select className="mt-1 rounded-2xl" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="6m">6 tháng (Phí 10.000đ)</option>
                <option value="1y">1 năm (Phí 20.000đ)</option>
                <option value="2y">2 năm (Phí 40.000đ)</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setShowAddCardModal(false)}>Hủy bỏ</Button>
            <Button variant="primary" className="rounded-2xl px-8" onClick={handleCreateCard} disabled={!foundUser}><Check className="w-4 h-4" /> Cấp & In thẻ</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Chi Tiết Thẻ */}
      <Modal open={!!selectedCard} onClose={() => setSelectedCard(null)} title="Chi tiết thẻ thư viện" size="md">
        <div className="space-y-6">
           <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center space-y-2">
              <div className="w-16 h-16 bg-white border border-gray-200 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm mb-4"><CreditCard className="w-8 h-8" /></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mã thẻ</p>
              <p className="text-2xl font-black text-gray-900 font-mono tracking-tighter">{selectedCard?.cardNumber}</p>
           </div>
           
           <div className="space-y-4 text-sm px-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Trạng thái</span>
                <Badge className={(cardStatusMap[selectedCard?.status]?.color || 'bg-gray-100 text-gray-500')}>
                   <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cardDotColors[selectedCard?.status] || 'bg-gray-400'}`} />{cardStatusMap[selectedCard?.status]?.label || selectedCard?.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Chủ thẻ</span>
                <span className="font-bold text-gray-900">{selectedCard?.user?.fullName || selectedCard?.user?.username}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">CCCD</span>
                <span className="font-bold text-gray-900">{selectedCard?.user?.idCardNumber || '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-400">Ngày cấp</span>
                <span className="font-bold text-gray-900">{selectedCard?.issuedDate ? new Date(selectedCard.issuedDate).toLocaleDateString('vi-VN') : '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Ngày hết hạn</span>
                <span className="font-bold text-gray-900">{selectedCard?.expiryDate ? new Date(selectedCard.expiryDate).toLocaleDateString('vi-VN') : '---'}</span>
              </div>
           </div>

           <div className="pt-4 border-t border-gray-50 text-center">
              <Button variant="primary" className="rounded-2xl px-8" onClick={() => setSelectedCard(null)}>Đóng</Button>
           </div>
        </div>
      </Modal>
    </div>
  )
}
