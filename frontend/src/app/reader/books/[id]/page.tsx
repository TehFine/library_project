'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { authApi, booksApi, reservationsApi, cardsApi, borrowRequestsApi, borrowsApi } from '@/lib/api'
import { Book, User, LibraryCard } from '@/types'
import { Badge, Card, Skeleton } from '@/components/ui'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import useBookCover from '@/hooks/useBookCover'
import { getBookCoverUrl } from '@/lib/utils'

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [book, setBook]           = useState<Book | null>(null)
  const [user, setUser]           = useState<User | null>(null)
  const [cards, setCards]         = useState<LibraryCard[]>([])
  const [loading, setLoading]     = useState(true)
  const [reserving, setReserving] = useState(false)
  const [borrowing, setBorrowing] = useState(false)
  const [reserved, setReserved]   = useState(false)
  const [borrowed, setBorrowed]   = useState(false)
  const [isCurrentlyBorrowed, setIsCurrentlyBorrowed] = useState(false)
  const [error, setError]         = useState('')
  const [coverError, setCoverError] = useState(false)
  const cover = useBookCover(book?.isbn, book?.coverUrl)
  const coverSrc = book ? (getBookCoverUrl(book) || cover) : null

  // Reset error when coverSrc changes (e.g. Google Books resolves after Open Library 404)
  useEffect(() => {
    setCoverError(false)
  }, [coverSrc])

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    try {
      const [b, u] = await Promise.all([
        booksApi.detail(id),
        authApi.me().catch(() => null)
      ])
      setBook(b)
      setUser(u)
      if (u) {
        const [userCards, myRequests, myBorrows] = await Promise.all([
          cardsApi.mine().catch(() => [] as LibraryCard[]),
          borrowRequestsApi.mine().catch(() => []),
          borrowsApi.mine({ status: 'borrowing', limit: 100 }).catch(() => ({ data: [] }))
        ])
        setCards(Array.isArray(userCards) ? userCards : [])
        // Kiểm tra nếu đã có yêu cầu mượn đang chờ xử lý cho cuốn sách này
        const hasPendingRequest = myRequests.some(
          (r: any) => r.bookId === id && r.status === 'pending'
        )
        if (hasPendingRequest) {
          setBorrowed(true)
        }
        // Kiểm tra nếu đang mượn cuốn sách này
        const activeBorrows = Array.isArray(myBorrows) ? myBorrows : (myBorrows as any)?.data ?? []
        const hasActiveBorrow = activeBorrows.some(
          (r: any) => r.bookCopy?.bookId === id
        )
        if (hasActiveBorrow) {
          setIsCurrentlyBorrowed(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }


  async function handleBorrow() {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setBorrowing(true)
    setError('')
    try {
      await borrowRequestsApi.create(id)
      setBorrowed(true)
    } catch (e: any) {
      setError(e.message || 'Gửi yêu cầu mượn thất bại')
    } finally {
      setBorrowing(false)
    }
  }

  async function handleReserve() {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setReserving(true)
    setError('')
    try {
      await reservationsApi.create(id)
      setReserved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Đặt trước thất bại')
    } finally {
      setReserving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-amber-300 border-t-transparent rounded-full" />
          <span className="text-amber-700 font-medium">Đang tải...</span>
        </div>
      </div>
    )
  }

  if (!book) {
    return <p className="text-gray-500">Không tìm thấy sách.</p>
  }

  const available = book.availableCopies > 0
  const activeCard = cards.find(c => c.status === 'active')
  const expiredCard = cards.find(c => c.status === 'expired')
  const lockedCard = cards.find(c => c.status === 'locked')

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-200 rounded-xl px-4 py-2 transition-all duration-200 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Quay lại
      </button>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Cover */}
        <div className="w-full md:w-48 shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 relative">
            {coverSrc && !coverError ? (
              <Image
                key={coverSrc}
                src={coverSrc}
                alt={book.title}
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                loading="eager"
                className="object-cover"
                onError={() => setCoverError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-200">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <Badge className="bg-gray-100 text-gray-600">{book.category.name}</Badge>
            <Badge className={available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}>
              {available ? `Còn ${book.availableCopies} bản sao` : 'Hết sách'}
            </Badge>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 leading-snug">{book.title}</h1>
          <p className="mt-1 text-gray-500">{book.author}</p>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {book.publisher && (
              <>
                <dt className="text-gray-400">Nhà xuất bản</dt>
                <dd className="text-gray-700">{book.publisher}</dd>
              </>
            )}
            {book.publishYear && (
              <>
                <dt className="text-gray-400">Năm xuất bản</dt>
                <dd className="text-gray-700">{book.publishYear}</dd>
              </>
            )}
            {book.isbn && (
              <>
                <dt className="text-gray-400">ISBN</dt>
                <dd className="text-gray-700 font-mono text-xs">{book.isbn}</dd>
              </>
            )}
            <dt className="text-gray-400">Số bản sao</dt>
            <dd className="text-gray-700">{book.availableCopies} / {book.totalCopies}</dd>
          </dl>

          {/* CTA */}
          <div className="mt-6 flex flex-col gap-3 max-w-xs">
            {borrowed ? (
              <Card className="bg-amber-50 border-amber-200">
                <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  Đang xử lý
                </p>
                <p className="text-xs text-amber-600 mt-2">Yêu cầu mượn của bạn đang chờ thủ thư duyệt.</p>
              </Card>
            ) : reserved ? (
              <Card className="bg-green-50 border-green-200">
                <p className="text-sm text-green-700 font-medium">Đặt trước thành công!</p>
                <p className="text-xs text-green-600 mt-1">Chúng tôi sẽ thông báo khi sách có sẵn.</p>
              </Card>
            ) : isCurrentlyBorrowed ? (
              <Card className="bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  Đang mượn sách này
                </p>
                <p className="text-xs text-blue-600 mt-2">Bạn đang mượn cuốn sách này. Vui lòng trả sách trước khi mượn lại.</p>
              </Card>
            ) : !user ? (
              <Card className="bg-amber-50 border-amber-200">
                <p className="text-sm text-amber-700 font-medium">Bạn cần đăng nhập</p>
                <p className="text-xs text-amber-600 mt-1 mb-3">Đăng nhập để có thể mượn hoặc đặt trước cuốn sách này.</p>
                <Link 
                  href="/auth/login"
                  className="inline-block w-full text-center py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-glow"
                >
                  Đăng nhập ngay
                </Link>
              </Card>
            ) : lockedCard ? (
              <Card className="bg-red-50 border-red-200">
                <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Thẻ đã bị khóa
                </p>
                <p className="text-xs text-red-600 mt-1">Thẻ thư viện của bạn đã bị khóa do có phí phạt chưa thanh toán. Vui lòng thanh toán phí phạt để tiếp tục mượn sách.</p>
              </Card>
            ) : expiredCard ? (
              <Card className="bg-red-50 border-red-200">
                <p className="text-sm text-red-700 font-medium">Thẻ đã hết hạn</p>
                <p className="text-xs text-red-600 mt-1 mb-3">Thẻ đã hết hạn, cần gia hạn để tiếp tục mượn sách.</p>
              </Card>
            ) : !activeCard ? (
              <Card className="bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Chưa có thẻ thư viện</p>
                <p className="text-xs text-blue-600 mt-1 mb-3">Bạn chưa có thẻ thư viện. Vui lòng liên hệ thủ thư để được cấp thẻ.</p>
              </Card>
            ) : available ? (
              <>
                <Button onClick={handleBorrow} loading={borrowing} variant="primary">
                  Gửi yêu cầu mượn
                </Button>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </>
            ) : (
              <>
                <Button onClick={handleReserve} loading={reserving} variant="secondary">
                  Đặt trước sách này
                </Button>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Mô tả</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{book.description}</p>
        </div>
      )}
    </div>
  )
}
