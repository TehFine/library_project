'use client'
import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  className?: string
  placeholder?: string
}

export default function SearchBar({ className, placeholder = 'Tìm kiếm tên sách hoặc tác giả...' }: SearchBarProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback((q: string) => {
    if (q.trim()) {
      router.push(`/reader/books?search=${encodeURIComponent(q.trim())}`)
    }
  }, [router])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSearch(value)
    }
    if (e.key === 'Escape') {
      setValue('')
      inputRef.current?.blur()
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-center transition-all duration-300',
        focused ? 'w-full max-w-lg' : 'w-full max-w-md',
        className,
      )}
    >
      {/* Search icon */}
      <span className="absolute left-4 text-gray-400 pointer-events-none z-10">
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full h-11 rounded-full pl-11 pr-4 text-sm text-gray-700',
          'bg-white border-none outline-none',
          'placeholder:text-gray-400',
          'transition-all duration-300',
          focused
            ? 'ring-2 ring-primary/40 shadow-[0_4px_20px_rgba(232,148,26,0.2)]'
            : 'ring-1 ring-amber-200 shadow-[0_2px_12px_rgba(180,130,50,0.1)] hover:ring-amber-300',
        )}
      />

      {/* Clear button */}
      {value && (
        <button
          onMouseDown={e => { e.preventDefault(); setValue('') }}
          className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-amber-100 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
