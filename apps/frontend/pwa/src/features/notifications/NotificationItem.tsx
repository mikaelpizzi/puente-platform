import React from 'react';
import { Notification, NotificationType } from './notificationsSlice';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

/**
 * Get icon for notification type.
 */
const getIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.ORDER_CREATED:
      return '🛒';
    case NotificationType.ORDER_ACCEPTED:
      return '✅';
    case NotificationType.ORDER_SHIPPED:
      return '🚚';
    case NotificationType.ORDER_DELIVERED:
      return '📦';
    case NotificationType.ORDER_CANCELLED:
      return '❌';
    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.PAYMENT_CONFIRMED:
      return '💰';
    case NotificationType.MESSAGE_RECEIVED:
      return '💬';
    case NotificationType.REVIEW_RECEIVED:
      return '⭐';
    case NotificationType.COURIER_ASSIGNED:
      return '🏍️';
    case NotificationType.SYSTEM:
    default:
      return '🔔';
  }
};

/**
 * Format relative time (e.g., "2 hours ago").
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHour < 24) return `Hace ${diffHour}h`;
  if (diffDay < 7) return `Hace ${diffDay}d`;

  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
};

/**
 * Single notification item component.
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="notification-icon">{getIcon(notification.type)}</div>
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-time">{formatRelativeTime(notification.createdAt)}</div>
      </div>
      <button
        className="notification-delete"
        onClick={handleDelete}
        aria-label="Delete notification"
      >
        ✕
      </button>

      <style>{`
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
        }
        .notification-item:hover {
          background: #f9fafb;
        }
        .notification-item.unread {
          background: #eff6ff;
        }
        .notification-item.unread:hover {
          background: #dbeafe;
        }
        .notification-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 50%;
        }
        .notification-item.unread .notification-icon {
          background: #bfdbfe;
        }
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        .notification-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: #111827;
          margin-bottom: 0.125rem;
        }
        .notification-message {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .notification-time {
          font-size: 0.6875rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
        .notification-delete {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0.25rem;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .notification-item:hover .notification-delete {
          opacity: 1;
        }
        .notification-delete:hover {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default NotificationItem;
