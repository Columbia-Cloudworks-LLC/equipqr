export interface OrganizationTabsOrganization {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled';
}

export interface OrganizationTabsStats {
  memberCount: number;
  adminCount: number;
  plan: string;
  featureCount: number;
}

export interface OrganizationTabsFleetMapSubscription {
  enabled: boolean;
  isPremiumFeature?: boolean;
  hasAccess?: boolean;
  upgradeRequired?: boolean;
}