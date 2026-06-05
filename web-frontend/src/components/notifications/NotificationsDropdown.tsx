// src/components/notifications/NotificationsDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, HeartIcon, UserPlusIcon, ChatBubbleLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import type { Notification } from '@/types';
import { useAuthStore } from '@/store/authStore';

const notificationIcons: Record<string, React.ReactNode> = {
  like: <HeartIcon className="w-4 h-4 text-red-500" />,
  follow: <UserPlusIcon className="w-4 h-4 text-green-500" />,
  comment: <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" />,
  review: <StarIcon className="w-4 h-4 text-yellow-500" />,
  live_event_started: <span className="text-red-500 text-base animate-pulse">🔴</span>,
  live_event_scheduled: <span className="text-orange-500 text-base">📅</span>,
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications, refetch } = useNotifications(1);
  const { data: unreadCount, refetch: refetchUnread } = useUnreadCount();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
      refetchUnread();
    }
  }, [isAuthenticated, refetch, refetchUnread]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    refetch();
    refetchUnread();
  };

  const unread = unreadCount?.count || 0;
  const notificationList = notifications || [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-500 hover:text-gallery-600 transition-colors rounded-full hover:bg-stone-50"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200 z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-gallery-600 hover:text-gallery-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationList.length === 0 ? (
              <div className="p-6 text-center">
                <BellIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">No notifications yet</p>
              </div>
            ) : (
              notificationList.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>

          {notificationList.length > 0 && (
            <div className="p-2 border-t border-stone-100">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs text-gallery-600 hover:text-gallery-700 py-1 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick }: { notification: Notification; onClick: () => void }) {
  const getLink = () => {
    if (notification.type === 'live_event_started' || notification.type === 'live_event_scheduled') {
      return `/live/${notification.entityId}`;
    }
    
    if (notification.entityId && notification.type !== 'follow') {
      return `/artwork/${notification.entityId}`;
    }
    
    if (notification.type === 'follow' && notification.triggeredByUserId) {
      if (notification.triggeredByUserType === 'Visitor') {
        return '#';  
      }
      return `/galleries/${notification.triggeredByUserId}`;
    }
    
    return '#';
  };

  const isClickable = () => {
    if (notification.type === 'live_event_started' || notification.type === 'live_event_scheduled') {
      return true;
    }
    if (notification.entityId && notification.type !== 'follow') {
      return true;
    }
    if (notification.type === 'follow' && notification.triggeredByUserId) {
      return notification.triggeredByUserType !== 'Visitor';
    }
    return false;
  };

  const getIcon = () => {
    if (notification.type === 'live_event_started') {
      return <span className="text-red-500 text-base animate-pulse">🔴</span>;
    }
    if (notification.type === 'live_event_scheduled') {
      return <span className="text-orange-500 text-base">📅</span>;
    }
    return notificationIcons[notification.type] || <BellIcon className="w-4 h-4 text-gray-400" />;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const clickable = isClickable();
  const linkTo = getLink();

  if (!clickable) {
    return (
      <div
        className={`flex items-start gap-3 p-3 border-b border-stone-100 last:border-0 ${
          !notification.isRead ? 'bg-gallery-50' : ''
        }`}
      >
        <div className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-700 leading-relaxed">{notification.message}</p>
          <p className="text-xs text-stone-400 mt-1">
            {formatTime(notification.createdAt)}
          </p>
        </div>
        
        {!notification.isRead && (
          <div className="w-2 h-2 bg-gallery-500 rounded-full shrink-0 mt-1" />
        )}
      </div>
    );
  }

  return (
    <Link
      to={linkTo}
      onClick={onClick}
      className={`flex items-start gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0 ${
        !notification.isRead ? 'bg-gallery-50' : ''
      }`}
    >
      <div className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-700 leading-relaxed">{notification.message}</p>
        <p className="text-xs text-stone-400 mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>
      
      {!notification.isRead && (
        <div className="w-2 h-2 bg-gallery-500 rounded-full shrink-0 mt-1" />
      )}
    </Link>
  );
}