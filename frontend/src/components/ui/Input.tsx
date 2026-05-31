'use client'
import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const isPassword = type === 'password'
    const actualType = isPassword && showPassword ? 'text' : type

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
            type={actualType}
            className={cn(
              'w-full h-11 rounded-full border-none bg-white/80 px-4 text-sm text-gray-800',
              'placeholder:text-gray-400 outline-none',
              'shadow-soft-sm ring-1 ring-amber-200/60',
              'focus:ring-2 focus:ring-primary/50 focus:bg-white',
              'disabled:bg-amber-50/50 disabled:text-gray-400 disabled:cursor-not-allowed',
              'transition-all duration-300',
              error && 'ring-2 ring-red-400 focus:ring-red-500',
              leftIcon  && 'pl-11',
              isPassword && 'pr-12',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-amber-100/50 transition-all duration-200 focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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