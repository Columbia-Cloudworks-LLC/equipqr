
export interface Invitation {
  id: string;
  email: string;
  team?: {
    name?: string;
    org_id?: string;
  };
  organization?: {
    name?: string;
    id?: string;
  };
  role: string;
  token: string;
  created_at: string;
  status?: string;
  invitationType?: 'team' | 'organization';
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
