import { Link } from 'react-router-dom';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';

export default function RecentlyViewed() {
  const { items, getRecentItems, removeItem, clearAll } = useRecentlyViewedStore();
  const recentItems = getRecentItems(6);

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-stone-500" />
          <h2 className="text-lg font-semibold text-stone-800">Recently Viewed</h2>
        </div>
        {items.length > 6 && (
          <button
            onClick={clearAll}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {recentItems.map((item) => (
          <div key={item.id} className="group relative">
            <Link
              to={`/artwork/${item.id}`}
              className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group/link"
            >
              <div className="aspect-square overflow-hidden bg-stone-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-stone-800 truncate group-hover/link:text-gallery-600 transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  {item.artistName}
                </p>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeItem(item.id);
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:scale-110"
              aria-label="Remove from recent"
            >
              <XMarkIcon className="w-3 h-3 text-stone-400 hover:text-red-500 transition-colors" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}