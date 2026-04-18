'use client'
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-full border-none bg-white/80 px-4 text-sm text-gray-800',
              'placeholder:text-gray-400 outline-none',
              'shadow-soft-sm ring-1 ring-amber-200/60',
              'focus:ring-2 focus:ring-primary/50 focus:bg-white',
              'disabled:bg-amber-50/50 disabled:text-gray-400 disabled:cursor-not-allowed',
              'transition-all duration-300',
              error && 'ring-2 ring-red-400 focus:ring-red-500',
              leftIcon  && 'pl-11',
              rightIcon && 'pr-11',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400 pl-1">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export default Input