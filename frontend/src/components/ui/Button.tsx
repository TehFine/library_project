'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-gradient-to-r from-primary to-primary-light text-white shadow-glow hover:brightness-105 disabled:opacity-50 disabled:shadow-none',
  secondary: 'bg-white shadow-soft-sm text-gray-700 hover:shadow-soft hover:text-gray-900 border border-amber-200/60 disabled:opacity-50',
  ghost:     'text-gray-600 hover:bg-white/70 hover:text-gray-900 disabled:opacity-50',
  danger:    'bg-red-500 text-white shadow-[0_6px_16px_-4px_rgba(239,68,68,0.4)] hover:brightness-105 disabled:opacity-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-8  px-4  text-xs  gap-1.5',
  md: 'h-10 px-5  text-sm  gap-2',
  lg: 'h-12 px-7  text-base gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold',
        'transition-all duration-300 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

export default Button