'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Book } from '@/types'
import { cn } from '@/lib/utils'

// ── Gradient palette for books without covers ──────────────────────────────────
const GRADIENTS = [
  'from-amber-400 to-orange-600',
  'from-blue-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-cyan-400 to-blue-600',
  'from-orange-400 to-red-600',
  'from-lime-400 to-green-600',
  'from-fuchsia-400 to-pink-700',
  'from-sky-400 to-cyan-600',
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
    <div className={cn(`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-3 text-center`, className)}>
      {/* Big initials */}
      <span className="text-white/30 font-black text-5xl leading-none select-none mb-2">
        {getInitials(title)}
      </span>
      {/* Title */}
      <span className="text-white text-xs font-semibold line-clamp-3 leading-snug drop-shadow-sm">
        {title}
      </span>
      <span className="text-white/70 text-[10px] mt-1 line-clamp-1">
        {author}
      </span>
    </div>
  )
}

// ── SmartImage — falls back to gradient on error ───────────────────────────────
function SmartImage({ src, title, author, fill, width, height, className }: {
  src: string; title: string; author: string
  fill?: boolean; width?: number; height?: number; className?: string
}) {
  const [error, setError] = useState(false)

  if (error) {
    return <BookCoverFallback title={title} author={author} />
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={title}
        fill
        className={className}
        onError={() => setError(true)}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={title}
      width={width ?? 40}
      height={height ?? 56}
      className={className}
      onError={() => setError(true)}
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
          <SmartImage
            src={book.coverUrl}
            title={book.title}
            author={book.author}
            fill
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
  return (
    <Link
      href={`/reader/books/${book.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/80 border-b border-amber-100/60 last:border-0 transition-colors"
    >
      {/* Mini cover */}
      <div className="w-10 h-14 rounded-xl flex-shrink-0 overflow-hidden shadow-sm relative">
        {book.coverUrl ? (
          <SmartImage
            src={book.coverUrl}
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