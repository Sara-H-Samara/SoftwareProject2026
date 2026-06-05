import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-gallery-500 to-purple-600 text-white ' +
    'shadow-md shadow-gallery-200 hover:shadow-lg hover:shadow-gallery-300 ' +
    'hover:from-gallery-600 hover:to-purple-700 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white text-stone-700 border border-stone-200 ' +
    'hover:border-gallery-300 hover:bg-gallery-50 hover:text-gallery-700 ' +
    'shadow-sm disabled:opacity-50',
  ghost:
    'text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-50',
  danger:
    'bg-red-50 text-red-600 border border-red-200 ' +
    'hover:bg-red-100 hover:border-red-300 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
}

/**
 * Primary button component. Supports variants, sizes, loading state, and icons.
 * Uses `forwardRef` for compatibility with Headless UI and form libraries.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 focus-ring',
          'disabled:cursor-not-allowed select-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading…</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
