interface SkeletonCardProps {
  variant?: 'gallery' | 'artwork' | 'profile';
}

export function SkeletonCard({ variant = 'gallery' }: SkeletonCardProps) {
  if (variant === 'artwork') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-card animate-pulse">
        <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 w-3/4 bg-stone-200 rounded" />
          <div className="h-3 w-1/2 bg-stone-200 rounded" />
          <div className="flex justify-between mt-2">
            <div className="h-4 w-12 bg-stone-200 rounded" />
            <div className="h-4 w-12 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 shadow-card animate-pulse">
        <div className="h-24 bg-gradient-to-br from-stone-100 to-stone-200 rounded-t-2xl" />
        <div className="p-6 pt-12">
          <div className="relative -mt-16 mb-4">
            <div className="w-24 h-24 rounded-full bg-stone-200 mx-auto" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-32 bg-stone-200 rounded mx-auto" />
            <div className="h-3 w-48 bg-stone-200 rounded mx-auto" />
            <div className="h-20 w-full bg-stone-200 rounded mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // Default gallery card skeleton
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-card animate-pulse">
      <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200" />
          <div className="flex-1">
            <div className="h-3 w-24 bg-stone-200 rounded" />
          </div>
        </div>
        <div className="h-4 w-3/4 bg-stone-200 rounded" />
        <div className="h-3 w-full bg-stone-200 rounded" />
        <div className="h-3 w-2/3 bg-stone-200 rounded" />
      </div>
    </div>
  );
}