export function SkeletonArtworkDetails() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-6 w-20 bg-stone-200 rounded mb-6" />
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="rounded-2xl overflow-hidden bg-stone-200 aspect-square" />
        
        {/* Details skeleton */}
        <div className="space-y-5">
          <div>
            <div className="h-8 w-3/4 bg-stone-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-stone-200 rounded" />
          </div>
          
          <div className="flex justify-between py-4 border-t border-b border-stone-100">
            <div className="flex gap-2">
              <div className="h-5 w-24 bg-stone-200 rounded" />
            </div>
            <div className="h-5 w-12 bg-stone-200 rounded" />
          </div>
          
          <div className="bg-stone-100 rounded-xl p-4">
            <div className="h-4 w-20 bg-stone-200 rounded mb-2" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-stone-200 rounded" />
              <div className="h-3 w-5/6 bg-stone-200 rounded" />
              <div className="h-3 w-4/6 bg-stone-200 rounded" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-stone-100">
              <div className="h-3 w-16 bg-stone-200 rounded mb-1" />
              <div className="h-4 w-20 bg-stone-200 rounded" />
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-100">
              <div className="h-3 w-16 bg-stone-200 rounded mb-1" />
              <div className="h-4 w-20 bg-stone-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}