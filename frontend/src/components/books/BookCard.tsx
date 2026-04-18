'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Book } from '@/types'
import { cn } from '@/lib/utils'

// ── BookCard (Grid) ───────────────────────────────────────────────────────────
interface BookCardProps {
  book: Book
  className?: string
}

export function BookCard({ book, className }: BookCardProps) {
  const available = book.availableCopies > 0

  return (
    <Link
      href={`/reader/books/${book.id}`}
      className={cn(
        'group flex flex-col rounded-3xl bg-amber-50/50 border border-amber-100/80 overflow-hidden',
        'hover:border-amber-300/60 hover:shadow-[0_4px_20px_rgba(180,140,80,0.15)] hover:-translate-y-1',
        'transition-all duration-300',
        className,
      )}
    >
      {/* Cover */}
      <div className="aspect-[2/3] bg-amber-50 relative overflow-hidden">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-amber-50 to-amber-100">
            <svg className="w-10 h-10 text-amber-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-xs text-amber-400 line-clamp-3 font-medium">{book.title}</span>
          </div>
        )}

        {/* Bookmark / availability chip */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            'text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm',
            available
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-600',
          )}>
            {available ? `Còn ${book.availableCopies}` : 'Hết'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3.5">
        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug">{book.title}</p>
        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{book.author}</p>
        <span className="mt-2 inline-flex self-start text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
          {book.category?.name}
        </span>
      </div>
    </Link>
  )
}

// ── BookListRow — dạng danh sách ─────────────────────────────────────────────
interface BookListRowProps {
  book: Book
}

export function BookListRow({ book }: BookListRowProps) {
  const available = book.availableCopies > 0
  return (
    <Link
      href={`/reader/books/${book.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/80 border-b border-amber-100/60 last:border-0 transition-colors"
    >
      {/* Mini cover */}
      <div className="w-10 h-14 bg-amber-100 rounded-xl flex-shrink-0 overflow-hidden shadow-sm">
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} width={40} height={56} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{book.title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{book.author}</p>
        <span className="mt-1 inline-flex text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
          {book.category?.name}
        </span>
      </div>

      {/* Status */}
      <div className="text-right shrink-0">
        <span className={cn(
          'text-xs px-3 py-1.5 rounded-full font-semibold',
          available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          {available ? `${book.availableCopies}/${book.totalCopies} có sẵn` : 'Hết sách'}
        </span>
      </div>
    </Link>
  )
}