export interface OrganizationData {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billing_email?: string;
  subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled';
  created_at: string;
  updated_at: string;
}

export interface OrganizationStats {
  totalEquipment: number;
  activeWorkOrders: number;
  teamCount: number;
  memberCount: number;
  completedWorkOrders: number;
  overdueWorkOrders: number;
}

export interface FleetMapSubscription {
  isEnabled: boolean;
  isPremiumFeature: boolean;
  hasAccess: boolean;
  upgradeRequired: boolean;
}

export interface OrganizationTabsProps {
  organization: OrganizationData;
  organizationStats: OrganizationStats;
  fleetMapSubscription: FleetMapSubscription;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  invited_at?: string;
  joined_at?: string;
  profiles?: {
    name: string;
    email: string;
  } | null;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string;
  invited_at: string;
  expires_at: string;
}