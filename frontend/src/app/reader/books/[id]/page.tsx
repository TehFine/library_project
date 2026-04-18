'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { booksApi, reservationsApi } from '@/lib/api'
import { Book } from '@/types'
import { Badge, Card, Skeleton } from '@/components/ui'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [book, setBook]           = useState<Book | null>(null)
  const [loading, setLoading]     = useState(true)
  const [reserving, setReserving] = useState(false)
  const [reserved, setReserved]   = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    booksApi.detail(id).then(setBook).finally(() => setLoading(false))
  }, [id])

  async function handleReserve() {
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
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-8">
          <Skeleton className="w-48 h-64 rounded-xl shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return <p className="text-gray-500">Không tìm thấy sách.</p>
  }

  const available = book.availableCopies > 0

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        ← Quay lại
      </button>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Cover */}
        <div className="w-full md:w-48 shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 relative">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
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
            {available ? (
              <Card className="bg-gray-50 border-gray-200">
                <p className="text-sm text-gray-700 font-medium">Sách đang có sẵn</p>
                <p className="text-xs text-gray-400 mt-1">Đến thư viện với thẻ độc giả để mượn sách.</p>
              </Card>
            ) : reserved ? (
              <Card className="bg-green-50 border-green-200">
                <p className="text-sm text-green-700 font-medium">Đặt trước thành công!</p>
                <p className="text-xs text-green-600 mt-1">Chúng tôi sẽ thông báo khi sách có sẵn.</p>
              </Card>
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
