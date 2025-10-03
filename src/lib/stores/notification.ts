import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: []
};

function createNotificationStore() {
  const { subscribe, update } = writable<NotificationState>(initialState);

  return {
    subscribe,

    show(notification: Omit<Notification, 'id'>): void {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = {
        id,
        duration: 3000,
        ...notification
      };

      update(state => ({
        ...state,
        notifications: [...state.notifications, newNotification]
      }));

      // Auto-remove after duration
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    },

    remove(id: string): void {
      update(state => ({
        ...state,
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    },

    clear(): void {
      update(state => ({
        ...state,
        notifications: []
      }));
    },

    // Convenience methods
    success(message: string, duration?: number): void {
      this.show({ message, type: 'success', duration });
    },

    error(message: string, duration?: number): void {
      this.show({ message, type: 'error', duration });
    },

    info(message: string, duration?: number): void {
      this.show({ message, type: 'info', duration });
    },

    warning(message: string, duration?: number): void {
      this.show({ message, type: 'warning', duration });
    }
  };
}

export const notificationStore = createNotificationStore();
