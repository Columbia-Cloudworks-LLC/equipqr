
import { useMemo } from 'react';
import { TeamMember } from '@/types';

interface UnifiedMember extends TeamMember {
  status: 'active' | 'pending';
  invitation_id?: string;
  invitation_email?: string;
  invitation_role?: string;
  created_at?: string;
}

interface UseUnifiedTeamMembersProps {
  members: TeamMember[];
  pendingInvitations: any[];
}

export function useUnifiedTeamMembers({ members, pendingInvitations }: UseUnifiedTeamMembersProps) {
  const unifiedMembers = useMemo(() => {
    const result: UnifiedMember[] = [];
    
    // Add active members
    members.forEach(member => {
      result.push({
        ...member,
        status: 'active'
      });
    });
    
    // Add pending invitations as "members" with pending status
    pendingInvitations.forEach(invitation => {
      result.push({
        id: invitation.id,
        user_id: invitation.id, // Use invitation ID as user_id for pending
        team_id: invitation.team_id,
        role: invitation.role,
        email: invitation.email,
        display_name: invitation.email.split('@')[0], // Use email prefix as display name
        status: 'pending',
        invitation_id: invitation.id,
        invitation_email: invitation.email,
        invitation_role: invitation.role,
        created_at: invitation.created_at,
        joined_at: invitation.created_at
      });
    });
    
    // Sort by status (active first, then pending) and then by name/email
    return result.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      const nameA = a.display_name || a.email || '';
      const nameB = b.display_name || b.email || '';
      return nameA.localeCompare(nameB);
    });
  }, [members, pendingInvitations]);
  
  return unifiedMembers;
}
