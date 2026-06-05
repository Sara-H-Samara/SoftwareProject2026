import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BellIcon, HeartIcon, UserPlusIcon, ChatBubbleLeftIcon, StarIcon,
  TrashIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useNotifications, useMarkAsRead, useDeleteNotification, useMarkAllAsRead } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import type { Notification } from '@/types'

const notificationIcons: Record<string, React.ReactNode> = {
  like:    <HeartIcon className="w-5 h-5 text-red-500" />,
  follow:  <UserPlusIcon className="w-5 h-5 text-green-500" />,
  comment: <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />,
  review:  <StarIcon className="w-5 h-5 text-yellow-500" />,
}

const notificationColors: Record<string, string> = {
  like:    'bg-red-50 border-red-100',
  follow:  'bg-green-50 border-green-100',
  comment: 'bg-blue-50 border-blue-100',
  review:  'bg-yellow-50 border-yellow-100',
}

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const [page, setPage] = useState(1)

  const { data: notifications, isLoading, refetch } = useNotifications(page)
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: deleteNotification } = useDeleteNotification()
  const { mutate: markAllAsRead } = useMarkAllAsRead()

  const notificationList: Notification[] = notifications ?? []

  /**
   * FIX #10: بدل totalCount = 0 الصلبة، نعتمد على وجود PAGE_SIZE عناصر
   * كمؤشر على وجود صفحة تالية محتملة.
   * الحل الدائم: تعديل API لترجع { items, totalCount }.
   */
  const hasNextPage = notificationList.length === PAGE_SIZE
  const hasPrevPage = page > 1

  const handleMarkAllRead = () => {
    markAllAsRead(undefined, {
      onSuccess: () => refetch(),
    })
  }

  /**
   * FIX #11: استبدال confirm() بـ toast مع زر تأكيد.
   * confirm() يوقف الـ JS thread ويُعطّل UX.
   */
  const handleDelete = (notificationId: string) => {
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Delete this notification?</span>
          <button
            onClick={() => {
              deleteNotification(notificationId)
              toast.dismiss(t.id)
            }}
            className="text-xs font-semibold text-red-500 hover:text-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      ),
      { duration: 5000 }
    )
  }

  const unreadCount = notificationList.filter(n => !n.isRead).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-stone-200 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-stone-100">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-200" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-stone-200 rounded mb-2" />
                      <div className="h-3 w-1/2 bg-stone-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notificationList.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <BellIcon className="w-10 h-10 text-stone-400" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">No notifications</h1>
            <p className="text-stone-500 mb-6">
              When someone likes, follows, or comments on your work, you'll see it here.
            </p>
            <Link to="/browse" className="inline-flex items-center gap-2 text-gallery-600 hover:text-gallery-700 font-medium">
              Browse galleries →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Notifications</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gallery-600 hover:text-gallery-700 hover:bg-gallery-50 rounded-lg transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {notificationList.map((notification) => (
            <div
              key={notification.id}
              className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                !notification.isRead
                  ? `${notificationColors[notification.type] ?? 'bg-stone-50 border-stone-100'} shadow-sm`
                  : 'bg-white border-stone-100 hover:border-stone-200'
              }`}
            >
              <div className="shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  !notification.isRead ? 'bg-white shadow-sm' : 'bg-stone-50'
                }`}>
                  {notificationIcons[notification.type]}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notification.isRead ? 'text-stone-900 font-medium' : 'text-stone-700'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1.5 text-stone-400 hover:text-gallery-600 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {(hasPrevPage || hasNextPage) && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-sm text-stone-600">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNextPage}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}