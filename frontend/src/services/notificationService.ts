import api from './api';
import { Notification, NotificationResponse } from '../types/notification';

const normalizeNotification = (notification: any): Notification => ({
  ...notification,
  data: notification.data || {
    title: notification.title || 'Notification',
    message: notification.body || '',
  },
});

export const notificationService = {
  /**
   * Get all notifications for the authenticated user
   */
  getNotifications: async (page: number = 1): Promise<NotificationResponse> => {
    const response = await api.get(`/v1/notifications?page=${page}`);
    return {
      ...response.data,
      data: Array.isArray(response.data.data) ? response.data.data.map(normalizeNotification) : [],
    };
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/v1/notifications/unread/count');
    return { count: response.data.count ?? response.data.unread_count ?? 0 };
  },

  /**
   * Get a specific notification
   */
  getNotification: async (id: string): Promise<{ data: Notification }> => {
    const response = await api.get(`/v1/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/v1/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.post('/v1/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a specific notification
   */
  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/notifications/${id}`);
    return response.data;
  },

  /**
   * Delete all notifications
   */
  deleteAll: async (): Promise<{ message: string }> => {
    const response = await api.delete('/v1/notifications/delete-all');
    return response.data;
  },
};
