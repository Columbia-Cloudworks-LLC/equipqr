
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserNotifications(): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
}
