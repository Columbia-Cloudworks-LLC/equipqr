
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getDashboardData, refreshDashboardData } from '@/services/dashboard/dashboardService';

// Prevent rapid refreshes of dashboard data
const REFRESH_THROTTLE_MS = 10000; // 10 seconds

export function useCombinedDashboardData(orgId?: string) {
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const lastRefreshTime = useRef<number>(0);
  
  const { user } = useAuth();
  const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();

  // Filter by provided org ID or selected organization
  const effectiveOrgId = orgId || selectedOrganization?.id;
  
  // Track visibility changes to pause/resume fetching
  const visibilityRef = useRef<boolean>(true);
  
  useEffect(() => {
    // Set up visibility change listener
    const handleVisibilityChange = () => {
      visibilityRef.current = document.visibilityState === 'visible';
      
      // If becoming visible after being hidden, consider refreshing data
      if (visibilityRef.current && user && isOrgReady && effectiveOrgId) {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime.current;
        
        // If it's been more than 30 seconds since last refresh, fetch new data
        if (timeSinceLastRefresh > 30000) {
          console.log('Tab became visible after inactivity, refreshing dashboard data');
          fetchDashboardData(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isOrgReady, effectiveOrgId]);

  useEffect(() => {
    // Set organization ready state when organization data is loaded and an organization is selected
    if (!isOrgLoading && selectedOrganization) {
      setIsOrgReady(true);
    } else {
      setIsOrgReady(false);
    }
  }, [isOrgLoading, selectedOrganization]);

  const processDashboardData = useCallback((data: any) => {
    // Process teams data
    if (data.teams) {
      setTeams(data.teams);
      setTeamCount(data.teams.length);
      setIsTeamsLoading(false);
      setIsTeamsError(false);
    } else {
      setTeams([]);
      setTeamCount(0);
      setIsTeamsLoading(false);
      setIsTeamsError(!!data.metadata?.teamsError);
    }

    // Process equipment data
    if (data.equipment) {
      setEquipment(data.equipment);
      setEquipmentCount(data.equipment.length);
      setIsEquipmentLoading(false);
      setIsEquipmentError(false);

      // Calculate counts
      const active = data.equipment.filter((item: any) => item.status === 'active').length;
      const maintenance = data.equipment.filter((item: any) => item.status === 'maintenance').length;
      
      setActiveCount(active);
      setMaintenanceCount(maintenance);
      
      // Get recent equipment (last 5)
      const recent = [...data.equipment]
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      setRecentEquipment(recent);
    } else {
      setEquipment([]);
      setEquipmentCount(0);
      setActiveCount(0);
      setMaintenanceCount(0);
      setRecentEquipment([]);
      setIsEquipmentLoading(false);
      setIsEquipmentError(!!data.metadata?.equipmentError);
    }

    // Process invitations data
    if (data.invitations) {
      setInvitations(data.invitations);
    } else {
      setInvitations([]);
    }
  }, []);

  const fetchDashboardData = useCallback(async (showErrorToast = true) => {
    if (!user || !effectiveOrgId) return;
    
    // Skip fetch if document is hidden
    if (!visibilityRef.current) {
      console.log('Document not visible, skipping dashboard data fetch');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDashboardData(effectiveOrgId);
      processDashboardData(data);
      lastRefreshTime.current = Date.now();
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      if (showErrorToast) {
        toast.error("Failed to load dashboard data", {
          description: err.message || "An unknown error occurred",
        });
      }
      
      setIsTeamsError(true);
      setIsEquipmentError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, effectiveOrgId, processDashboardData]);

  // Function to refresh all dashboard data with throttling
  const refreshDashboardDataWithThrottle = useCallback(async () => {
    const now = Date.now();
    
    // Prevent refreshing too frequently
    if (now - lastRefreshTime.current < REFRESH_THROTTLE_MS) {
      toast.info('Please wait a moment before refreshing again');
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      const data = await refreshDashboardData(effectiveOrgId);
      processDashboardData(data);
      toast.success('Dashboard data refreshed');
      lastRefreshTime.current = now;
    } catch (error: any) {
      console.error('Failed to refresh dashboard data:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  }, [effectiveOrgId, processDashboardData]);

  useEffect(() => {
    // Only fetch data when user is authenticated AND organization is ready
    if (user && isOrgReady && effectiveOrgId) {
      console.log(`Dashboard: fetching data for org ${effectiveOrgId}`);
      fetchDashboardData();
    } else if (!effectiveOrgId && user) {
      console.log('Dashboard: waiting for organization selection');
      setIsLoading(true);
    }
  }, [user, isOrgReady, effectiveOrgId, fetchDashboardData]);

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
    isRefreshing,
    isOrgReady,
    error,
    isTeamsError,
    isEquipmentError,
    invitations,
    equipment,
    refetchDashboard: refreshDashboardDataWithThrottle
  };
}
