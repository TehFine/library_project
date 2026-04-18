import { useState } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  limit?: number
}

export function usePagination({ initialPage = 1, limit = 12 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / limit)

  function reset() { setPage(1) }

  return { page, setPage, total, setTotal, totalPages, limit, reset }
}