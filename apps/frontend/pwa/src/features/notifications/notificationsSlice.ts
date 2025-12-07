import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Notification type enum.
 */
export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_ACCEPTED = 'order_accepted',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  MESSAGE_RECEIVED = 'message_received',
  REVIEW_RECEIVED = 'review_received',
  COURIER_ASSIGNED = 'courier_assigned',
  SYSTEM = 'system',
}

/**
 * Single notification interface.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Notification state interface.
 */
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  lastFetchedAt: string | null;
}

// Load initial state from localStorage
const loadFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('puente_notifications');
    if (stored) {
      return JSON.parse(stored) as Notification[];
    }
  } catch (e) {
    console.error('Error loading notifications from storage:', e);
  }
  return [];
};

// Save notifications to localStorage
const saveToStorage = (notifications: Notification[]) => {
  try {
    // Keep only last 100 notifications
    const toSave = notifications.slice(0, 100);
    localStorage.setItem('puente_notifications', JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving notifications to storage:', e);
  }
};

const storedNotifications = loadFromStorage();

const initialState: NotificationState = {
  notifications: storedNotifications,
  unreadCount: storedNotifications.filter((n) => !n.isRead).length,
  isOpen: false,
  lastFetchedAt: null,
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /**
     * Add a new notification to the top of the list.
     */
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id' | 'isRead' | 'createdAt'>>,
    ) => {
      const newNotification: Notification = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(newNotification);
      state.unreadCount++;
      saveToStorage(state.notifications);
    },

    /**
     * Add multiple notifications at once (from polling).
     */
    addNotifications: (state, action: PayloadAction<Notification[]>) => {
      const existingIds = new Set(state.notifications.map((n) => n.id));
      const newNotifications = action.payload.filter((n) => !existingIds.has(n.id));

      if (newNotifications.length > 0) {
        state.notifications = [...newNotifications, ...state.notifications].slice(0, 100);
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
        saveToStorage(state.notifications);
      }
      state.lastFetchedAt = new Date().toISOString();
    },

    /**
     * Mark a single notification as read.
     */
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        saveToStorage(state.notifications);
      }
    },

    /**
     * Mark all notifications as read.
     */
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
      saveToStorage(state.notifications);
    },

    /**
     * Delete a notification.
     */
    deleteNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
        saveToStorage(state.notifications);
      }
    },

    /**
     * Clear all notifications.
     */
    clearAll: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      saveToStorage(state.notifications);
    },

    /**
     * Toggle the notification panel.
     */
    togglePanel: (state) => {
      state.isOpen = !state.isOpen;
    },

    /**
     * Set panel open state.
     */
    setOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const {
  addNotification,
  addNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  togglePanel,
  setOpen,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
