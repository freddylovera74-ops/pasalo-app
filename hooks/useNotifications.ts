import { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Notification } from '../types';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestoreService.getNotifications(user.uid, (data) => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    await firestoreService.markNotificationAsRead(user.uid, notificationId);
  };

  return { notifications, unreadCount, markAsRead };
};
