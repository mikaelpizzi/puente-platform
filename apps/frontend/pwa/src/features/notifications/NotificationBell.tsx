import React, { useState, useRef, useEffect } from 'react';
import { NotificationCenter } from './NotificationCenter';
import { Notification } from './notificationsSlice';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

/**
 * Notification bell icon with badge and dropdown.
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button
        className="notification-bell"
        onClick={handleToggle}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDelete={onDelete}
          onClearAll={onClearAll}
          onClose={() => setIsOpen(false)}
          onNotificationClick={onNotificationClick}
        />
      )}

      <style>{`
        .notification-bell-container {
          position: relative;
        }
        .notification-bell {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          position: relative;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-bell:hover {
          opacity: 0.8;
        }
        .bell-icon {
          display: block;
        }
        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          font-family: system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
