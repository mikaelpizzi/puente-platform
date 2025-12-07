import React from 'react';
import { NotificationItem } from './NotificationItem';
import { Notification } from './notificationsSlice';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

/**
 * Group notifications by date (Today, Yesterday, Earlier).
 */
const groupByDate = (notifications: Notification[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isYesterday = (date: Date) => date.toDateString() === yesterday.toDateString();

  const groups: { label: string; notifications: Notification[] }[] = [
    { label: 'Hoy', notifications: [] },
    { label: 'Ayer', notifications: [] },
    { label: 'Anteriores', notifications: [] },
  ];

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (isToday(date)) {
      groups[0].notifications.push(n);
    } else if (isYesterday(date)) {
      groups[1].notifications.push(n);
    } else {
      groups[2].notifications.push(n);
    }
  });

  return groups.filter((g) => g.notifications.length > 0);
};

/**
 * Notification center dropdown/panel component.
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onClose,
  onNotificationClick,
}) => {
  const groups = groupByDate(notifications);

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h3>Notificaciones</h3>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount} nuevas</span>}
        <button className="close-button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="notification-center-actions">
          {unreadCount > 0 && <button onClick={onMarkAllAsRead}>Marcar todo como leído</button>}
          <button onClick={onClearAll} className="clear-all">
            Limpiar todo
          </button>
        </div>
      )}

      <div className="notification-center-content">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔔</span>
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="notification-group">
              <div className="group-label">{group.label}</div>
              {group.notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <style>{`
        .notification-center {
          position: absolute;
          top: 100%;
          right: 0;
          width: 380px;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (max-width: 480px) {
          .notification-center {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }
        }
        .notification-center-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .notification-center-header h3 {
          margin: 0;
          font-size: 1rem;
          flex: 1;
        }
        .unread-badge {
          background: #3b82f6;
          color: white;
          font-size: 0.6875rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
        }
        .close-button {
          background: none;
          border: none;
          font-size: 1rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
        }
        .close-button:hover {
          color: #111827;
        }
        .notification-center-actions {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa;
        }
        .notification-center-actions button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
        }
        .notification-center-actions button:hover {
          text-decoration: underline;
        }
        .notification-center-actions .clear-all {
          color: #6b7280;
        }
        .notification-center-content {
          flex: 1;
          overflow-y: auto;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          color: #9ca3af;
        }
        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }
        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }
        .notification-group {
          border-bottom: 1px solid #e5e7eb;
        }
        .group-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
