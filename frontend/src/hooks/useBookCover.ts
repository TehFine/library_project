'use client'
import { useState, useEffect, useRef } from 'react'
import { getOpenLibraryCoverUrl, getGoogleBooksCover } from '@/lib/utils'

/**
 * Fetches book cover from 3 sources in order:
 * 1. `coverUrl` (DB/local) — handled externally via getBookCoverUrl()
 * 2. Open Library Covers API — returns image URL instantly (?default=false → 404 if missing)
 * 3. Google Books API — async fallback for more coverage
 *
 * Usage: `const cover = useBookCover(book.isbn, book.coverUrl)`
 * Then:  `const src = getBookCoverUrl(book) || cover`
 */
export default function useBookCover(isbn?: string | null, coverUrl?: string | null): string | null {
  const [cover, setCover] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setCover(null)

    if (!coverUrl && isbn) {
      // 1. Open Library immediately (SmartImage's onError catches 404)
      setCover(getOpenLibraryCoverUrl(isbn))

      // 2. Google Books API (takes longer but has more data)
      getGoogleBooksCover(isbn).then(url => {
        if (!cancelledRef.current && url) {
          setCover(url)
        }
      })
    }
    return () => { cancelledRef.current = true }
  }, [isbn, coverUrl])

  return cover
}
