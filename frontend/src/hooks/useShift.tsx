'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { librarianApi } from '@/lib/api'

export interface ShiftDetail {
  id: string
  startTime: string
  endTime: string
  note?: string
  librarianName: string | null
}

interface ShiftContextValue {
  onShift: boolean | null   // null = loading, true = in shift, false = not in shift
  shiftDetail: ShiftDetail | null  // chi tiết ca hiện tại (nếu đang trong ca)
  loading: boolean
  checkShift: () => Promise<void>
}

const ShiftContext = createContext<ShiftContextValue>({
  onShift: null,
  shiftDetail: null,
  loading: true,
  checkShift: async () => {},
})

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [onShift, setOnShift] = useState<boolean | null>(null)
  const [shiftDetail, setShiftDetail] = useState<ShiftDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const checkShift = useCallback(async () => {
    setLoading(true)
    try {
      const res = await librarianApi.checkShift()
      setOnShift(res.onShift)
      setShiftDetail(res.shift)
    } catch {
      setOnShift(null)
      setShiftDetail(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkShift()
  }, [checkShift])

  return (
    <ShiftContext.Provider value={{ onShift, shiftDetail, loading, checkShift }}>
      {children}
    </ShiftContext.Provider>
  )
}

export function useShift(): ShiftContextValue {
  const ctx = useContext(ShiftContext)
  if (!ctx) throw new Error('useShift must be used within ShiftProvider')
  return ctx
}
