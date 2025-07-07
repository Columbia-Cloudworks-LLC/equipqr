import { supabase } from '@/integrations/supabase/client';
import { 
  OrganizationInvitation, 
  CreateInvitationData, 
  InvitationError,
  InvitationFilters,
  InvitationMetrics
} from '@/types/invitation';

export class InvitationService {
  private static readonly INVITATION_EXPIRY_DAYS = 7;

  static async getInvitations(
    organizationId: string,
    filters?: InvitationFilters
  ): Promise<OrganizationInvitation[]> {
    if (!organizationId) return [];

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new InvitationError('User not authenticated', 'PERMISSION_DENIED');

    // Check if user is admin of the organization
    const isAdmin = await this.checkAdminPermission(userData.user.id, organizationId);

    // Build query based on admin status
    let query = supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organizationId);

    // Apply permission filtering
    if (!isAdmin) {
      query = query.eq('invited_by', userData.user.id);
    }

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    // Apply role filter
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    // Apply search filter
    if (filters?.search) {
      query = query.ilike('email', `%${filters.search}%`);
    }

    const { data: invitationsData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw new InvitationError('Failed to fetch invitations', 'UNKNOWN', error);
    }

    // Get inviter name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userData.user.id)
      .single();
    
    const inviterName = profileData?.name || 'You';

    return (invitationsData || []).map(invitation => this.mapInvitationData(invitation, inviterName));
  }

  static async createInvitation(
    organizationId: string,
    requestData: CreateInvitationData
  ): Promise<OrganizationInvitation> {
    if (!organizationId) {
      throw new InvitationError('No organization ID provided', 'INVALID_DATA');
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new InvitationError('User not authenticated', 'PERMISSION_DENIED');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      throw new InvitationError('Invalid email format', 'INVALID_DATA');
    }

    // Check admin permissions
    const isAdmin = await this.checkAdminPermission(userData.user.id, organizationId);
    if (!isAdmin) {
      throw new InvitationError('You do not have permission to invite members', 'PERMISSION_DENIED');
    }

    // Check for existing invitation
    const existingInvitation = await this.findExistingInvitation(organizationId, requestData.email);
    if (existingInvitation) {
      throw new InvitationError('An active invitation already exists for this email', 'DUPLICATE_INVITATION');
    }

    // Create invitation
    const { data: createdInvitation, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: requestData.email.toLowerCase().trim(),
        role: requestData.role,
        message: requestData.message || null,
        invited_by: userData.user.id,
        expires_at: new Date(Date.now() + this.INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error(`[INVITATION] Creation error:`, error);
      throw new InvitationError('Failed to create invitation', 'UNKNOWN', error);
    }

    // Handle slot reservation in background
    if (requestData.reserveSlot) {
      this.reserveSlotInBackground(organizationId, createdInvitation.id);
    }

    // Send invitation email in background
    this.sendInvitationEmailInBackground(organizationId, createdInvitation, requestData);

    return this.mapInvitationData(createdInvitation, 'You');
  }

  static async resendInvitation(organizationId: string, invitationId: string): Promise<OrganizationInvitation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new InvitationError('User not authenticated', 'PERMISSION_DENIED');
    }

    // Check permissions
    const canManage = await this.checkInvitationManagePermission(userData.user.id, invitationId);
    if (!canManage) {
      throw new InvitationError('You do not have permission to resend this invitation', 'PERMISSION_DENIED');
    }

    const { data, error } = await supabase
      .from('organization_invitations')
      .update({
        expires_at: new Date(Date.now() + this.INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      throw new InvitationError('Failed to resend invitation', 'UNKNOWN', error);
    }

    return this.mapInvitationData(data, 'You');
  }

  static async cancelInvitation(organizationId: string, invitationId: string): Promise<OrganizationInvitation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new InvitationError('User not authenticated', 'PERMISSION_DENIED');
    }

    // Check permissions
    const canManage = await this.checkInvitationManagePermission(userData.user.id, invitationId);
    if (!canManage) {
      throw new InvitationError('You do not have permission to cancel this invitation', 'PERMISSION_DENIED');
    }

    const { data, error } = await supabase
      .from('organization_invitations')
      .update({ 
        status: 'expired', 
        expired_at: new Date().toISOString() 
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      throw new InvitationError('Failed to cancel invitation', 'UNKNOWN', error);
    }

    return this.mapInvitationData(data, 'You');
  }

  static async getInvitationMetrics(organizationId: string): Promise<InvitationMetrics> {
    const invitations = await this.getInvitations(organizationId);
    
    return {
      totalInvitations: invitations.length,
      pendingInvitations: invitations.filter(inv => inv.status === 'pending').length,
      acceptedInvitations: invitations.filter(inv => inv.status === 'accepted').length,
      expiredInvitations: invitations.filter(inv => inv.status === 'expired').length,
    };
  }

  // Private helper methods
  private static async checkAdminPermission(userId: string, organizationId: string): Promise<boolean> {
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    return memberData?.role === 'owner' || memberData?.role === 'admin';
  }

  private static async findExistingInvitation(organizationId: string, email: string) {
    const { data } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    return data;
  }

  private static async checkInvitationManagePermission(userId: string, invitationId: string): Promise<boolean> {
    // Get invitation details to check permissions
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select('invited_by, organization_id')
      .eq('id', invitationId)
      .single();

    if (!invitation) return false;

    // If user created the invitation, they can manage it
    if (invitation.invited_by === userId) return true;

    // Check if user is admin
    return await this.checkAdminPermission(userId, invitation.organization_id);
  }

  private static mapInvitationData(invitation: any, inviterName: string): OrganizationInvitation {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as 'admin' | 'member',
      status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired',
      message: invitation.message || undefined,
      invitedBy: invitation.invited_by,
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
      acceptedAt: invitation.accepted_at || undefined,
      inviterName: inviterName,
      slot_reserved: invitation.slot_reserved || false,
      slot_purchase_id: invitation.slot_purchase_id || undefined,
      declined_at: invitation.declined_at || undefined,
      expired_at: invitation.expired_at || undefined
    };
  }

  // Background task methods
  private static reserveSlotInBackground(organizationId: string, invitationId: string): void {
    (async () => {
      try {
        const { error } = await supabase.rpc('reserve_slot_for_invitation', {
          org_id: organizationId,
          invitation_id: invitationId
        });
        
        if (error) {
          console.warn('[INVITATION] Failed to reserve slot:', error);
        }
      } catch (error) {
        console.warn('[INVITATION] Slot reservation error:', error);
      }
    })();
  }

  private static sendInvitationEmailInBackground(
    organizationId: string, 
    invitation: any, 
    requestData: CreateInvitationData
  ): void {
    setTimeout(async () => {
      try {
        // Get profile and organization data for email
        const [profileResult, organizationResult] = await Promise.all([
          supabase.from('profiles').select('name').eq('id', invitation.invited_by).single(),
          supabase.from('organizations').select('name').eq('id', organizationId).single()
        ]);

        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            invitationId: invitation.id,
            email: requestData.email.toLowerCase().trim(),
            role: requestData.role,
            organizationName: organizationResult.data?.name || 'Your Organization',
            inviterName: profileResult.data?.name || 'Team Member',
            message: requestData.message
          }
        });

        if (emailError) {
          console.error('[INVITATION] Failed to send invitation email:', emailError);
        } else {
          console.log(`[INVITATION] Email sent successfully for ${requestData.email}`);
        }
      } catch (emailError) {
        console.error('[INVITATION] Error calling email function:', emailError);
      }
    }, 0);
  }
}