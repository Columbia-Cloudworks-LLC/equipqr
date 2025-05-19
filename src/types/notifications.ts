
export interface Invitation {
  id: string;
  email: string;
  team?: {
    name: string;
  };
  organization?: {
    name: string;
  };
  role: string;
  token: string;
  created_at: string;
  status?: string;
  invitationType?: 'team' | 'organization'; // New field to distinguish invitation types
  org_name?: string;
  team_name?: string;
}

export interface NotificationsContextType {
  invitations: Invitation[];
  isLoading: boolean;
  hasNewNotifications: boolean;
  refreshNotifications: () => Promise<void>;
  dismissInvitation: (id: string) => void;
  resetDismissedNotifications: () => void;
}
