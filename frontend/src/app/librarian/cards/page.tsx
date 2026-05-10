'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'

// Mock Data
const MOCK_CARDS = [
  { id: 'TV-2024-001', name: 'Trần Văn Minh', cccd: '001099000001', issuedDate: '10/01/2024', expiryDate: '10/01/2025', status: 'active' },
  { id: 'TV-2024-002', name: 'Lê Thị Hoa', cccd: '001099000002', issuedDate: '01/02/2024', expiryDate: '01/02/2025', status: 'active' },
  { id: 'TV-2023-015', name: 'Nguyễn Văn B', cccd: '001099000003', issuedDate: '01/06/2023', expiryDate: '01/06/2024', status: 'expired' },
]

export default function LibrarianCardsPage() {
  const [search, setSearch] = useState('')
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [cccd, setCccd] = useState('')
  const [userInfo, setUserInfo] = useState<{name: string, phone: string} | null>(null)

  const handleSearchCCCD = () => {
    // Mock API call to find user by CCCD
    if (cccd === '123') {
      setUserInfo({ name: 'Trần Đăng Khoa', phone: '0901234567' })
    } else {
      setUserInfo(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý thẻ độc giả" description="Cấp mới, gia hạn, và khóa thẻ thư viện" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="🔍 Tìm theo tên, mã thẻ, CCCD..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select 
            value="all"
            onChange={() => {}}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="suspended">Bị khóa</option>
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowAddCardModal(true)}>+ Cấp thẻ mới</Button>
      </div>

      {/* Main Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Mã thẻ</th>
                <th className="py-4 px-6 font-medium">Độc giả</th>
                <th className="py-4 px-6 font-medium">Ngày cấp</th>
                <th className="py-4 px-6 font-medium">Hết hạn</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_CARDS.map(card => (
                <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">{card.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{card.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{card.issuedDate}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {card.status === 'expired' ? (
                      <span className="text-red-600 font-medium">❌ {card.expiryDate}</span>
                    ) : (
                      card.expiryDate
                    )}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {card.status === 'expired' ? (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">Hủy</Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm">Gia hạn</Button>
                        <Button variant="ghost" size="sm" className="text-amber-600 hover:bg-amber-50">Khóa</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cấp Thẻ Mới */}
      <Modal open={showAddCardModal} onClose={() => {setShowAddCardModal(false); setUserInfo(null); setCccd('')}} title="Cấp thẻ thư viện mới" size="lg">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Tra cứu CCCD (để lấy thông tin tài khoản online)</label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="Nhập số CCCD..." value={cccd} onChange={e => setCccd(e.target.value)} className="flex-1" />
              <Button variant="secondary" onClick={handleSearchCCCD}>Kiểm tra</Button>
            </div>
          </div>
          
          {userInfo ? (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <p className="text-emerald-800 font-medium flex items-center gap-2">✅ Đã tìm thấy tài khoản hệ thống</p>
              <div className="mt-2 text-sm text-emerald-700 space-y-1">
                <p>Họ tên: <span className="font-medium">{userInfo.name}</span></p>
                <p>Số điện thoại: <span className="font-medium">{userInfo.phone}</span></p>
              </div>
            </div>
          ) : cccd.length > 0 ? (
            <div className="text-sm text-gray-500 italic">Vui lòng nhập &quot;123&quot; để test data có sẵn, hoặc điền form tay nếu độc giả chưa có tài khoản online.</div>
          ) : null}

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="text-sm font-medium text-gray-700">Họ và tên</label>
              <Input className="mt-1" placeholder="Họ và tên độc giả" value={userInfo?.name || ''} readOnly={!!userInfo} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Thời hạn thẻ</label>
              <Select 
                className="mt-1"
                value="1y"
                onChange={() => {}}
              >
                <option value="6m">6 tháng (Thu phí 5.000đ)</option>
                <option value="1y">1 năm (Thu phí 10.000đ)</option>
                <option value="2y">2 năm (Thu phí 20.000đ)</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setShowAddCardModal(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => setShowAddCardModal(false)}>Lưu & In thẻ</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
