
export interface Invitation {
  id: string;
  email: string;
  team: {
    name: string;
  };
  role: string;
  token: string;
  created_at: string;
}

export interface NotificationsContextType {
  invitations: Invitation[];
  isLoading: boolean;
  hasNewNotifications: boolean;
  refreshNotifications: () => Promise<void>;
  dismissInvitation: (id: string) => void;
  resetDismissedNotifications: () => void;
}
