
import { useEffect, useCallback } from 'react';
import { UserRole } from '@/types/supabase-enums';
import { useOrganizationMembersState } from './organization/useOrganizationMembersState';
import { useOrganizationMembersFetcher } from './organization/useOrganizationMembersFetcher';
import { useOrganizationInvitations } from './organization/useOrganizationInvitations';
import { useOrganizationMemberManagement } from './organization/useOrganizationMemberManagement';

export function useOrganizationMembers(organizationId: string) {
  const {
    members,
    setMembers,
    pendingInvitations,
    setPendingInvitations,
    isLoading,
    setIsLoading,
    isInviting,
    setIsInviting
  } = useOrganizationMembersState();

  const { fetchMembers } = useOrganizationMembersFetcher();
  const {
    fetchPendingInvitations,
    handleInviteMember: inviteMember,
    handleResendInvite,
    handleCancelInvitation
  } = useOrganizationInvitations();
  const { handleRemoveMember: removeMember } = useOrganizationMemberManagement();

  const refetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersData, invitationsData] = await Promise.all([
        fetchMembers(organizationId),
        fetchPendingInvitations(organizationId)
      ]);
      setMembers(membersData);
      setPendingInvitations(invitationsData);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fetchMembers, fetchPendingInvitations, setMembers, setPendingInvitations, setIsLoading]);

  useEffect(() => {
    refetchMembers();
  }, [refetchMembers]);

  const handleInviteMember = useCallback(async (email: string, role: UserRole) => {
    setIsInviting(true);
    try {
      await inviteMember(organizationId, email, role);
      const invitationsData = await fetchPendingInvitations(organizationId);
      setPendingInvitations(invitationsData);
    } finally {
      setIsInviting(false);
    }
  }, [organizationId, inviteMember, fetchPendingInvitations, setPendingInvitations, setIsInviting]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    const success = await removeMember(organizationId, memberId);
    if (success) {
      const membersData = await fetchMembers(organizationId);
      setMembers(membersData);
    }
  }, [organizationId, removeMember, fetchMembers, setMembers]);

  const handleCancelInvitationWithRefresh = useCallback(async (invitationId: string) => {
    try {
      await handleCancelInvitation(invitationId);
      const invitationsData = await fetchPendingInvitations(organizationId);
      setPendingInvitations(invitationsData);
    } catch (error) {
      // Error handling is done in handleCancelInvitation
    }
  }, [handleCancelInvitation, fetchPendingInvitations, organizationId, setPendingInvitations]);

  return {
    members,
    pendingInvitations,
    isLoading,
    isInviting,
    handleInviteMember,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation: handleCancelInvitationWithRefresh,
    refetchMembers
  };
}
