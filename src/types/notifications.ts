
import { Invitation } from './index';

// Export the same Invitation interface to ensure consistency
export type { Invitation } from './index';

// Define the helper types for notifications
export interface NotificationBase {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  title: string;
  message: string;
  action_url?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface InvitationNotification extends NotificationBase {
  type: 'invitation';
  invitation: Invitation;
}

export interface SystemNotification extends NotificationBase {
  type: 'system';
  system_id: string;
}

export type Notification = InvitationNotification | SystemNotification;

// Add the NotificationsContextType
export interface NotificationsContextType {
  invitations: Invitation[];
  isLoading: boolean;
  hasNewNotifications: boolean;
  hasError: boolean;
  error?: string;
  unreadCount?: number;
  lastRefreshed?: Date;
  fetchInvitations?: () => Promise<boolean>;
  refreshNotifications: () => Promise<boolean>;
  dismissInvitation: (id: string) => Promise<void>;
  resetDismissedNotifications: () => void;
  isRefreshPending: boolean;
}
