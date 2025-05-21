
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { getTeams } from '@/services/team/retrieval';

export function useDashboardData(orgId?: string) {
  const [teamCount, setTeamCount] = useState<number>(0);
  const [equipmentCount, setEquipmentCount] = useState<number>(0);
  const [teams, setTeams] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [recentEquipment, setRecentEquipment] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [maintenanceCount, setMaintenanceCount] = useState<number>(0);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTeamsLoading, setIsTeamsLoading] = useState<boolean>(true);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamsError, setIsTeamsError] = useState<boolean>(false);
  const [isEquipmentError, setIsEquipmentError] = useState<boolean>(false);
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();

  // Filter by provided org ID or selected organization
  const effectiveOrgId = orgId || selectedOrganization?.id;

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    
    setIsTeamsLoading(true);
    setIsTeamsError(false);
    
    try {
      // Fetch teams
      const teamsData = await getTeams();
      const filteredTeams = effectiveOrgId
        ? teamsData.filter((team) => team.org_id === effectiveOrgId)
        : teamsData;
      
      setTeams(filteredTeams);
      setTeamCount(filteredTeams.length);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setIsTeamsError(true);
      toast.error("Failed to load teams data", {
        description: err.message || "An unknown error occurred",
      });
    } finally {
      setIsTeamsLoading(false);
    }
  }, [user, effectiveOrgId]);

  const fetchEquipment = useCallback(async () => {
    if (!user) return;
    
    setIsEquipmentLoading(true);
    setIsEquipmentError(false);
    
    try {
      // Fetch equipment with organization filter if provided
      let query = supabase.from('equipment').select('*');
      
      if (effectiveOrgId) {
        query = query.eq('org_id', effectiveOrgId);
      }
      
      const { data, error } = await query.is('deleted_at', null);
      
      if (error) throw error;
      
      setEquipment(data || []);
      setEquipmentCount(data?.length || 0);
      
      // Calculate counts
      const active = data?.filter(item => item.status === 'active')?.length || 0;
      const maintenance = data?.filter(item => item.status === 'maintenance')?.length || 0;
      
      setActiveCount(active);
      setMaintenanceCount(maintenance);
      
      // Get recent equipment (last 5)
      const recent = [...(data || [])]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      setRecentEquipment(recent);
    } catch (err: any) {
      console.error('Error fetching equipment:', err);
      setIsEquipmentError(true);
      toast.error("Failed to load equipment data", {
        description: err.message || "An unknown error occurred",
      });
    } finally {
      setIsEquipmentLoading(false);
    }
  }, [user, effectiveOrgId]);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*, team:team_id(*)')
        .eq('email', user.email)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      setInvitations(data || []);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchTeams(),
          fetchEquipment(),
          fetchInvitations()
        ]);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        toast.error("Failed to load dashboard data", {
          description: err.message || "An unknown error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, effectiveOrgId, fetchTeams, fetchEquipment, fetchInvitations]);

  return {
    teamCount,
    equipmentCount,
    teams,
    activeCount,
    maintenanceCount,
    recentEquipment,
    isLoading,
    isTeamsLoading,
    isEquipmentLoading,
    error,
    isTeamsError,
    isEquipmentError,
    invitations,
    equipment,
    refetchTeams: fetchTeams,
    refetchEquipment: fetchEquipment
  };
}
