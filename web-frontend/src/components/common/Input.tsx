import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

/**
 * Styled text input with optional label, error message, hint text,
 * and icon slots. Forwards ref for use with react-hook-form or similar.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-stone-700"
          >
            {label}
            {props.required && (
              <span className="text-gallery-400 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-stone-900',
              'placeholder:text-stone-400 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-gallery-400 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-stone-200 hover:border-stone-300',
              leftIcon ? 'pl-10' : '',
              rightElement ? 'pr-10' : '',
              className,
            ].join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400 flex items-center gap-1" role="alert">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-stone-400">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
