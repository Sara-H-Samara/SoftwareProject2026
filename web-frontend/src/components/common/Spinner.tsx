// ── Spinner ────────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin text-gallery-500 ${sizeMap[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── Full-page loading overlay ─────────────────────────────────────────────────

export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center gap-4 z-50">
      <Spinner size="lg" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

// ── Skeleton card shimmer placeholder ────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="shimmer aspect-[4/3] w-full" />
      <div className="p-4 space-y-2">
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-3 w-1/2 rounded" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
