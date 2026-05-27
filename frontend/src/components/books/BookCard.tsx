'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Book } from '@/types'
import useBookCover from '@/hooks/useBookCover'
import { cn, getBookCoverUrl } from '@/lib/utils'

// ── Gradient palette for books without covers ──────────────────────────────────
const GRADIENTS = [
  'from-amber-400 via-amber-500 to-orange-600',
  'from-blue-400 via-blue-500 to-indigo-600',
  'from-emerald-400 via-emerald-500 to-teal-600',
  'from-rose-400 via-rose-500 to-pink-600',
  'from-violet-400 via-violet-500 to-purple-600',
  'from-cyan-400 via-cyan-500 to-blue-600',
  'from-orange-400 via-orange-500 to-red-600',
  'from-lime-400 via-lime-500 to-green-600',
  'from-fuchsia-400 via-fuchsia-500 to-pink-700',
  'from-sky-400 via-sky-500 to-cyan-600',
]

function getGradient(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) & 0xffffffff
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}



function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 3)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ── BookCoverFallback ─────────────────────────────────────────────────────────
function BookCoverFallback({ title, author, className }: { title: string; author: string; className?: string }) {
  const gradient = getGradient(title)
  return (
    <div className={cn(`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-center`, className)}>
      {/* Decorative top pattern */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
      <div className="absolute top-1 left-0 right-0 h-[1px] bg-white/10" />
      
      {/* Book icon */}
      <svg className="w-8 h-8 text-white/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      
      {/* Big title */}
      <span className="text-white font-bold text-sm leading-tight line-clamp-4 drop-shadow-sm">
        {title}
      </span>
      
      {/* Author */}
      <span className="text-white/60 text-[10px] mt-1.5 line-clamp-1 font-medium">
        {author}
      </span>
      
      {/* Bottom decorative bar */}
      <div className="absolute bottom-3 left-4 right-4 h-[2px] bg-white/10 rounded-full" />
    </div>
  )
}

// ── SmartImage — falls back to gradient on error ───────────────────────────────
function SmartImage({ src, title, author, fill, width, height, className, loading }: {
  src: string; title: string; author: string
  fill?: boolean; width?: number; height?: number; className?: string
  loading?: 'lazy' | 'eager'
}) {
  const [error, setError] = useState(false)

  if (error) {
    return <BookCoverFallback title={title} author={author} />
  }

  const commonProps = {
    alt: title,
    className,
    onError: () => setError(true),
  }

  if (fill) {
    return (
      <Image
        src={src}
        {...commonProps}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        loading={loading ?? 'lazy'}
      />
    )
  }
  return (
    <Image
      src={src}
      {...commonProps}
      width={width ?? 40}
      height={height ?? 56}
    />
  )
}

// ── BookCard (Grid) ───────────────────────────────────────────────────────────
interface BookCardProps {
  book: Book
  className?: string
}

export function BookCard({ book, className }: BookCardProps) {
  const available = book.availableCopies > 0
  const cover = useBookCover(book.isbn, book.coverUrl)
  const coverSrc = getBookCoverUrl(book) || cover

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
        {coverSrc ? (
          <SmartImage
            key={coverSrc}
            src={coverSrc}
            title={book.title}
            author={book.author}
            fill
            loading="eager"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <BookCoverFallback title={book.title} author={book.author} />
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
  const cover = useBookCover(book.isbn, book.coverUrl)
  const coverSrc = getBookCoverUrl(book) || cover
  return (
    <Link
      href={`/reader/books/${book.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/80 border-b border-amber-100/60 last:border-0 transition-colors"
    >
      {/* Mini cover */}
      <div className="w-10 h-14 rounded-xl flex-shrink-0 overflow-hidden shadow-sm relative">
        {coverSrc ? (
          <SmartImage
            key={coverSrc}
            src={coverSrc}
            title={book.title}
            author={book.author}
            width={40}
            height={56}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="absolute inset-0">
            <BookCoverFallback title={book.title} author={book.author} />
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