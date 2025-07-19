
export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedDate: string;
  avatar?: string;
  status: 'active' | 'pending' | 'inactive';
}

export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  logo?: string;
  backgroundColor?: string;
}

export interface InvitationData {
  email: string;
  role: 'admin' | 'member';
  message?: string;
}
