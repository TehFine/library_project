'use client'
import { cn } from '@/lib/utils'
import { Category } from '@/types'

interface CategoryTabsProps {
  categories: Category[]
  activeId: number | undefined
  onSelect: (id: number | undefined) => void
  className?: string
}

export default function CategoryTabs({ categories, activeId, onSelect, className }: CategoryTabsProps) {
  const all = { id: undefined as number | undefined, name: 'Tất cả' }
  const tabs = [all, ...categories.map(c => ({ id: c.id as number | undefined, name: c.name }))]

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide', className)}>
      {tabs.map(tab => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id ?? 'all'}
            onClick={() => onSelect(tab.id)}
            className={cn(
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-glow'
                : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800 border border-amber-200/60 hover:border-amber-300',
            )}
          >
            {tab.name}
          </button>
        )
      })}
    </div>
  )
}
