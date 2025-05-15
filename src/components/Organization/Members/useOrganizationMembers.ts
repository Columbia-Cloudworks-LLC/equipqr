
import { useState, useEffect } from 'react';
import { getOrganizationMembers } from '@/services/organization';
import { OrganizationMember } from '@/services/organization/types';
import { UserRole } from '@/types/supabase-enums';

export function useOrganizationMembers(organizationId: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('members');

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData);
      } catch (error: any) {
        console.error('Error fetching organization members:', error);
        setError('Failed to load organization members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [organizationId, refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInviteSent = () => {
    setActiveTab('invitations');
    refreshData();
  };

  return {
    members,
    loading,
    error,
    refreshTrigger,
    activeTab,
    setActiveTab,
    refreshData,
    handleInviteSent,
    setMembers
  };
}
