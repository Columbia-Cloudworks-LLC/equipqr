export interface OrganizationInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviterName?: string;
  slot_reserved?: boolean;
  slot_purchase_id?: string;
  declined_at?: string;
  expired_at?: string;
}

export interface CreateInvitationData {
  email: string;
  role: 'admin' | 'member';
  message?: string;
  reserveSlot?: boolean;
}

export interface InvitationFilters {
  status?: OrganizationInvitation['status'];
  role?: OrganizationInvitation['role'];
  search?: string;
}

export interface InvitationMetrics {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
}

export type InvitationAction = 'resend' | 'cancel' | 'delete';

export interface InvitationActionResult {
  success: boolean;
  message: string;
  data?: OrganizationInvitation;
}

export class InvitationError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'DUPLICATE_INVITATION' | 'INVALID_DATA' | 'NOT_FOUND' | 'UNKNOWN',
    public details?: any
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}