import { ArrowLeftIcon, BellIcon, FunnelIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import ActivityFeed from '@/components/activity/ActivityFeed'

const FILTERS = [
  { value: 'all', label: 'All activity', icon: '📋' },
  { value: 'like', label: 'Likes', icon: '❤️' },
  { value: 'follow', label: 'Follows', icon: '👥' },
  { value: 'comment', label: 'Comments', icon: '💬' },
  { value: 'review', label: 'Reviews', icon: '⭐' },
] as const

type FilterValue = typeof FILTERS[number]['value']

export default function ActivityFeedPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [showFilter, setShowFilter] = useState(false)

  const activeFilterLabel = FILTERS.find(f => f.value === activeFilter)?.label

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky header */}
      <div className="sticky top-16 z-30 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-4">
            {/* Back button */}
            <Link
              to="/"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-gallery-500 shrink-0" />
                <h1 className="text-xl font-bold text-stone-800 truncate">Activity Feed</h1>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200
                                 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                What's happening with artists you follow
              </p>
            </div>

            {/* Filter button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={[
                  'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  activeFilter !== 'all'
                    ? 'bg-gallery-50 border border-gallery-200 text-gallery-700 shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300',
                ].join(' ')}
              >
                <FunnelIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {activeFilter !== 'all' ? activeFilterLabel : 'Filter'}
                </span>
                {activeFilter !== 'all' && (
                  <span className="w-2 h-2 rounded-full bg-gallery-500" />
                )}
              </button>

              {/* Filter dropdown */}
              {showFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-stone-100
                                  shadow-xl z-20 py-1 overflow-hidden animate-fade-in">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Filter by
                      </p>
                    </div>
                    {FILTERS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => {
                          setActiveFilter(f.value)
                          setShowFilter(false)
                        }}
                        className={[
                          'w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          activeFilter === f.value
                            ? 'bg-gallery-50 text-gallery-700 font-medium'
                            : 'text-stone-600 hover:bg-stone-50',
                        ].join(' ')}
                      >
                        <span className="text-base">{f.icon}</span>
                        <span className="flex-1 text-left">{f.label}</span>
                        {activeFilter === f.value && (
                          <CheckIcon className="w-4 h-4 text-gallery-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Active filter indicator */}
        {activeFilter !== 'all' && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Showing:</span>
              <span className="inline-flex items-center gap-1.5 bg-gallery-50 border border-gallery-200
                               text-gallery-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <span>{FILTERS.find(f => f.value === activeFilter)?.icon}</span>
                <span>{activeFilterLabel}</span>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="ml-1 text-gallery-400 hover:text-gallery-600 transition-colors"
                  aria-label="Clear filter"
                >
                  ×
                </button>
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-400">
              <SparklesIcon className="w-3 h-3" />
              <span>Real-time updates</span>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <ActivityFeed filter={activeFilter === 'all' ? undefined : activeFilter} />
      </div>
    </div>
  )
}