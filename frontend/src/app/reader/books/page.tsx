'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookCard, BookListRow } from '@/components/books/BookCard'
import { Pagination, EmptyState, Skeleton } from '@/components/ui'
import CategoryTabs from '@/components/ui/CategoryTabs'
import { booksApi, categoriesApi } from '@/lib/api'
import { Book, Category } from '@/types'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

export default function BooksPage() {
  const searchParams = useSearchParams()

  const [books, setBooks]           = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)

  const [search, setSearch]         = useState(searchParams?.get('search') ?? '')
  const [catId, setCatId]           = useState<number | undefined>()
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [viewMode, setViewMode]     = useState<ViewMode>('grid')

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const LIMIT = 20

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await booksApi.list({
        page: p, limit: LIMIT,
        ...(search        && { search }),
        ...(catId         && { categoryId: catId }),
        ...(onlyAvailable && { available: 1 }),
      })
      setBooks(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [search, catId, onlyAvailable])

  useEffect(() => { categoriesApi.list().then(setCategories) }, [])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); load(1) }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search, catId, onlyAvailable, load])

  useEffect(() => { load(page) }, [page, load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Tìm kiếm sách</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} đầu sách trong thư viện</p>
      </div>

      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        activeId={catId}
        onSelect={id => { setCatId(id); setPage(1) }}
        className="mb-5"
      />

      {/* Secondary filters row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Local search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Lọc theo tên sách, tác giả..."
            className="w-full h-10 rounded-full pl-10 pr-4 text-sm bg-white/80 text-gray-700 placeholder:text-gray-400 outline-none ring-1 ring-amber-200/60 focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Available only toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none bg-white/70 rounded-full px-4 py-2 ring-1 ring-amber-200/60 hover:ring-amber-300 transition-all">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={e => setOnlyAvailable(e.target.checked)}
            className="rounded border-amber-300 text-primary focus:ring-primary w-3.5 h-3.5"
          />
          Chỉ sách có sẵn
        </label>

        {/* View toggle */}
        <div className="flex bg-amber-100/60 rounded-full overflow-hidden ring-1 ring-amber-200/60 p-0.5">
          {(['grid', 'list'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={cn(
                'px-3 py-1.5 rounded-full transition-all duration-200',
                viewMode === m
                  ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-glow'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {m === 'grid' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-3xl bg-amber-50/50 border border-amber-100/80 overflow-hidden">
                <Skeleton className="aspect-[2/3] rounded-none" />
                <div className="p-3.5 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-amber-50/40 border border-amber-100/80 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-amber-50">
                <Skeleton className="w-10 h-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3 rounded-full" />
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : books.length === 0 ? (
        <div className="rounded-3xl bg-white shadow-card py-16">
          <EmptyState
            title="Không tìm thấy sách nào"
            description="Thử thay đổi từ khóa hoặc bộ lọc"
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map(b => <BookCard key={b.id} book={b} />)}
        </div>
      ) : (
        <div className="rounded-3xl bg-white shadow-card overflow-hidden">
          {books.map(b => <BookListRow key={b.id} book={b} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}