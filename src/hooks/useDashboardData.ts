
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
  const [isOrgReady, setIsOrgReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTeamsError, setIsTeamsError] = useState<boolean>(false);
  const [isEquipmentError, setIsEquipmentError] = useState<boolean>(false);
  
  const { user } = useAuth();
  const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();

  // Filter by provided org ID or selected organization
  const effectiveOrgId = orgId || selectedOrganization?.id;

  useEffect(() => {
    // Set organization ready state when organization data is loaded and an organization is selected
    if (!isOrgLoading && selectedOrganization) {
      setIsOrgReady(true);
    } else {
      setIsOrgReady(false);
    }
  }, [isOrgLoading, selectedOrganization]);

  const fetchTeams = useCallback(async () => {
    if (!user || !effectiveOrgId) return;
    
    setIsTeamsLoading(true);
    setIsTeamsError(false);
    
    try {
      // Fetch teams
      const teamsData = await getTeams();
      
      // IMPORTANT: Only process teams for the specified organization
      const filteredTeams = teamsData.filter((team) => team.org_id === effectiveOrgId);
      
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
    if (!user || !effectiveOrgId) return;
    
    setIsEquipmentLoading(true);
    setIsEquipmentError(false);
    
    try {
      // Fetch equipment with mandatory organization filter
      const query = supabase.from('equipment').select(`
        *,
        org:org_id (name),
        team:team_id (name, org_id)
      `)
      .eq('org_id', effectiveOrgId)
      .is('deleted_at', null);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process equipment to ensure org_name is available
      const processedData = data ? data.map(item => ({
        ...item,
        org_name: item.org?.name || 'Unknown Organization',
        team_name: item.team?.name || null
      })) : [];
      
      setEquipment(processedData);
      setEquipmentCount(processedData.length);
      
      // Calculate counts
      const active = processedData.filter(item => item.status === 'active').length;
      const maintenance = processedData.filter(item => item.status === 'maintenance').length;
      
      setActiveCount(active);
      setMaintenanceCount(maintenance);
      
      // Get recent equipment (last 5)
      const recent = [...processedData]
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

    // Only fetch data when user is authenticated AND organization is ready
    // This prevents showing unfiltered data during the authentication/org selection process
    if (user && isOrgReady && effectiveOrgId) {
      console.log(`Dashboard: fetching data for org ${effectiveOrgId}`);
      fetchData();
    } else if (!effectiveOrgId && user) {
      console.log('Dashboard: waiting for organization selection');
      setIsLoading(true);
    }
  }, [user, isOrgReady, effectiveOrgId, fetchTeams, fetchEquipment, fetchInvitations]);

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
    isOrgReady,
    error,
    isTeamsError,
    isEquipmentError,
    invitations,
    equipment,
    refetchTeams: fetchTeams,
    refetchEquipment: fetchEquipment
  };
}
