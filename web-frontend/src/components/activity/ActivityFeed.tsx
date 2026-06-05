// src/components/activity/ActivityFeed.tsx
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlusIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { useActivityFeed } from '@/hooks/useActivity'
import { PageLoader } from '@/components/common/Spinner'
import type { Activity } from '@/types'

// ── Activity type config ──────────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  like: {
    icon:       <HeartSolid className="w-3.5 h-3.5 text-red-500" />,
    bg:         'bg-red-50',
    border:     'border-red-100',
    ring:       'ring-red-100',
    dot:        'bg-red-400',
    label:      'Like',
  },
  follow: {
    icon:       <UserPlusIcon className="w-3.5 h-3.5 text-gallery-600" />,
    bg:         'bg-gallery-50',
    border:     'border-gallery-100',
    ring:       'ring-gallery-100',
    dot:        'bg-gallery-400',
    label:      'Follow',
  },
  comment: {
    icon:       <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-blue-500" />,
    bg:         'bg-blue-50',
    border:     'border-blue-100',
    ring:       'ring-blue-100',
    dot:        'bg-blue-400',
    label:      'Comment',
  },
  review: {
    icon:       <StarSolid className="w-3.5 h-3.5 text-amber-500" />,
    bg:         'bg-amber-50',
    border:     'border-amber-100',
    ring:       'ring-amber-100',
    dot:        'bg-amber-400',
    label:      'Review',
  },
} as const

type ActivityType = keyof typeof ACTIVITY_CONFIG

function getConfig(type: string) {
  return ACTIVITY_CONFIG[type as ActivityType] ?? ACTIVITY_CONFIG.like
}

interface ActivityFeedProps {
  filter?: 'like' | 'follow' | 'comment' | 'review'
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  activityType,
}: {
  src?: string | null
  name?: string | null
  activityType: string
}) {
  const cfg = getConfig(activityType)
  
  const getAvatarSrc = () => {
    if (src && !src.includes('default-avatar')) {
      return src
    }
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=128&rounded=true`
    }
    return '/default-avatar.jpg' 
  }

  return (
    <div className="relative shrink-0">
      <img
        src={getAvatarSrc()}
        alt={name ?? 'User'}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${name?.charAt(0) || 'U'}&background=8B5CF6&color=fff&size=128&rounded=true`;
        }}
      />

      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full
                       ${cfg.bg} border-2 border-white shadow-sm
                       flex items-center justify-center`}>
        {cfg.icon}
      </div>
    </div>
  )
}

// ── Single activity item ──────────────────────────────────────────────────────
function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const cfg = getConfig(activity.type)

  const entityLink = activity.entityId ? `/artwork/${activity.entityId}` : '#'
  
  const profileLink = activity.actorId ? `/galleries/${activity.actorId}` : '#'
  const isProfileClickable = !!activity.actorId

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    } catch {
      return ''
    }
  })()

  return (
    <div className="relative flex gap-4">
      {/* Vertical timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-px bg-stone-100" aria-hidden="true" />
      )}

      {/* Avatar */}
      <div className="shrink-0 z-10">
        <Avatar src={activity.actorAvatar} name={activity.actorName} activityType={activity.type} />
      </div>

      {/* Content card */}
      <div className={`flex-1 min-w-0 mb-5 bg-white rounded-2xl border ${cfg.border}
                       shadow-card hover:shadow-card-hover hover:border-opacity-70
                       transition-all duration-200 overflow-hidden group`}>

        {/* Main row */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              
              {isProfileClickable ? (
                <Link to={profileLink}
                      className="text-sm font-semibold text-stone-800 hover:text-gallery-600
                                 transition-colors truncate block">
                  {activity.actorName ?? 'Someone'}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-stone-500 block">
                  {activity.actorName ?? 'Someone'}
                </span>
              )}

              <Link to={entityLink}
                    className="mt-0.5 text-sm text-stone-500 hover:text-stone-700
                               transition-colors leading-relaxed line-clamp-2 block">
                {activity.message}
              </Link>
            </div>

            {/* Type badge */}
            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1
                              text-[11px] font-semibold rounded-full
                              ${cfg.bg} border ${cfg.border}`}>
              {cfg.icon}
              <span className="text-stone-600">{cfg.label}</span>
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-stone-400 mt-2">{timeAgo}</p>
        </div>

        {/* Artwork preview strip */}
        {activity.entityImage && (
          <Link to={entityLink}
                className="flex items-center gap-3 px-4 py-3 border-t border-stone-50
                           bg-stone-50/60 hover:bg-stone-50 transition-colors group/art">
            <img
              src={activity.entityImage}
              alt={activity.entityTitle ?? 'Artwork'}
              className="w-12 h-12 rounded-xl object-cover shadow-sm
                         group-hover/art:scale-105 transition-transform duration-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-700 truncate group-hover/art:text-gallery-600 transition-colors">
                {activity.entityTitle ?? 'View artwork'}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">Tap to view</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-stone-300 group-hover/art:text-gallery-500
                                       group-hover/art:translate-x-0.5 transition-all" />
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Date group header ─────────────────────────────────────────────────────────
function DateHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="flex-1 h-px bg-stone-200" />
      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-1 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-stone-200" />
    </div>
  )
}

// Group activities by relative date label
function groupByDate(activities: Activity[]): { label: string; items: Activity[] }[] {
  const now   = Date.now()
  const ONE_DAY  = 86_400_000
  const ONE_WEEK = ONE_DAY * 7

  const groups: Record<string, Activity[]> = {}

  for (const a of activities) {
    const diff = now - new Date(a.createdAt).getTime()
    const label =
      diff < ONE_DAY  ? 'Today' :
      diff < ONE_DAY * 2 ? 'Yesterday' :
      diff < ONE_WEEK     ? 'This week' :
      diff < ONE_WEEK * 2 ? 'Last week' : 'Older'
    groups[label] = groups[label] ? [...groups[label], a] : [a]
  }

  const ORDER = ['Today', 'Yesterday', 'This week', 'Last week', 'Older']
  return ORDER
    .filter(l => groups[l])
    .map(l => ({ label: l, items: groups[l] }))
}

// ── Load more button ──────────────────────────────────────────────────────────
function LoadMoreButton({
  onClick,
  loading,
}: {
  onClick: () => void
  loading: boolean
}) {
  return (
    <div className="flex justify-center pt-2 pb-6">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                   bg-white border border-stone-200 text-stone-600 shadow-sm
                   hover:border-gallery-300 hover:text-gallery-700 hover:bg-gallery-50
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-gallery-400 border-t-transparent
                             rounded-full animate-spin" />
            Loading…
          </>
        ) : (
          <>Load more activity</>
        )}
      </button>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-20 px-6">
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-stone-100
                      flex items-center justify-center">
        <BellIcon className="h-10 w-10 text-stone-300" />
      </div>
      <h3 className="text-lg font-bold text-stone-700 mb-2">No activity yet</h3>
      <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed mb-6">
        Follow artists to see their latest likes, reviews, and uploads right here.
      </p>
      <Link to="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                       bg-gradient-to-r from-gallery-500 to-purple-600 text-white shadow-sm
                       hover:from-gallery-600 hover:to-purple-700 transition-all">
        Browse galleries
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  )
}

// ── Main component with filter support ────────────────────────────────────────
export default function ActivityFeed({ filter }: ActivityFeedProps = {}) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeed()

  if (isLoading) return <PageLoader message="Loading activity…" />

  const allActivities = data?.pages.flatMap(p => p.activities) ?? []

  const activities = filter
    ? allActivities.filter(activity => activity.type === filter)
    : allActivities

  if (activities.length === 0) return <EmptyState />

  const groups = groupByDate(activities)

  return (
    <div>
      {/* Header with count and live indicator */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-stone-900">Activity</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {activities.length} recent action{activities.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-gallery-50 border border-gallery-200
                        text-gallery-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-gallery-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Timeline */}
      <div>
        {groups.map(group => (
          <Fragment key={group.label}>
            <DateHeader label={group.label} />
            {group.items.map((activity) => {
              const globalIndex = group.items.indexOf(activity)
              return (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={globalIndex === group.items.length - 1 && groups.indexOf(group) === groups.length - 1}
                />
              )
            })}
          </Fragment>
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && !filter && (
        <LoadMoreButton onClick={fetchNextPage} loading={isFetchingNextPage} />
      )}
    </div>
  )
}