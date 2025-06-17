
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface SessionOrganization {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  userRole: 'owner' | 'admin' | 'member';
  userStatus: 'active' | 'pending' | 'inactive';
}

export interface SessionTeamMembership {
  teamId: string;
  teamName: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  joinedDate: string;
}

export interface SessionData {
  organizations: SessionOrganization[];
  currentOrganizationId: string | null;
  teamMemberships: SessionTeamMembership[];
  lastUpdated: string;
  version: number;
}

interface SessionContextType {
  sessionData: SessionData | null;
  isLoading: boolean;
  error: string | null;
  getCurrentOrganization: () => SessionOrganization | null;
  switchOrganization: (organizationId: string) => void;
  hasTeamRole: (teamId: string, role: string) => boolean;
  hasTeamAccess: (teamId: string) => boolean;
  canManageTeam: (teamId: string) => boolean;
  getUserTeamIds: () => string[];
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

const SESSION_STORAGE_KEY = 'equipqr_session_data';
const SESSION_VERSION = 1;

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessionFromStorage = (): SessionData | null => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Check version compatibility
      if (parsed.version !== SESSION_VERSION) {
        console.log('Session version mismatch, clearing stored data');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      
      // Check if data is recent (less than 1 hour old)
      const lastUpdated = new Date(parsed.lastUpdated);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdated < oneHourAgo) {
        console.log('Session data expired, will refresh');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading session from storage:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  };

  const saveSessionToStorage = (data: SessionData) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  };

  const fetchSessionData = async (): Promise<SessionData> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching fresh session data for user:', user.id);

    // Fetch organizations with user role
    const { data: orgData, error: orgError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          plan,
          member_count,
          max_members,
          features,
          billing_cycle,
          next_billing_date
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      throw orgError;
    }

    const organizations: SessionOrganization[] = (orgData || [])
      .filter(item => item.organizations)
      .map(item => ({
        id: item.organizations.id,
        name: item.organizations.name,
        plan: item.organizations.plan as 'free' | 'premium',
        memberCount: item.organizations.member_count,
        maxMembers: item.organizations.max_members,
        features: item.organizations.features,
        billingCycle: item.organizations.billing_cycle as 'monthly' | 'yearly' | undefined,
        nextBillingDate: item.organizations.next_billing_date || undefined,
        userRole: item.role as 'owner' | 'admin' | 'member',
        userStatus: item.status as 'active' | 'pending' | 'inactive'
      }));

    // Get current organization (first one or from storage)
    const storedData = loadSessionFromStorage();
    let currentOrganizationId = organizations.length > 0 ? organizations[0].id : null;
    
    if (storedData?.currentOrganizationId && organizations.find(org => org.id === storedData.currentOrganizationId)) {
      currentOrganizationId = storedData.currentOrganizationId;
    }

    // Fetch team memberships for current organization
    let teamMemberships: SessionTeamMembership[] = [];
    
    if (currentOrganizationId) {
      const { data: teamData, error: teamError } = await supabase
        .rpc('get_user_team_memberships', {
          user_uuid: user.id,
          org_id: currentOrganizationId
        });

      if (teamError) {
        console.error('Error fetching team memberships:', teamError);
        // Don't throw here, just log the error
      } else {
        teamMemberships = (teamData || []).map(item => ({
          teamId: item.team_id,
          teamName: item.team_name,
          role: item.role as 'manager' | 'technician' | 'requestor' | 'viewer',
          joinedDate: item.joined_date
        }));
      }
    }

    const sessionData: SessionData = {
      organizations,
      currentOrganizationId,
      teamMemberships,
      lastUpdated: new Date().toISOString(),
      version: SESSION_VERSION
    };

    console.log('Fetched session data:', sessionData);
    return sessionData;
  };

  const refreshSession = async () => {
    if (!user) {
      setSessionData(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      const newSessionData = await fetchSessionData();
      setSessionData(newSessionData);
      saveSessionToStorage(newSessionData);
    } catch (err) {
      console.error('Error refreshing session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session';
      setError(errorMessage);
      
      // Try to use cached data if available
      const cachedData = loadSessionFromStorage();
      if (cachedData) {
        console.log('Using cached session data due to error');
        setSessionData(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    setSessionData(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const getCurrentOrganization = (): SessionOrganization | null => {
    if (!sessionData?.currentOrganizationId) return null;
    return sessionData.organizations.find(org => org.id === sessionData.currentOrganizationId) || null;
  };

  const switchOrganization = async (organizationId: string) => {
    if (!sessionData) return;
    
    const organization = sessionData.organizations.find(org => org.id === organizationId);
    if (!organization) {
      console.warn('Organization not found:', organizationId);
      return;
    }

    console.log('Switching to organization:', organizationId);
    
    try {
      // Fetch team memberships for the new organization
      const { data: teamData, error: teamError } = await supabase
        .rpc('get_user_team_memberships', {
          user_uuid: user!.id,
          org_id: organizationId
        });

      const teamMemberships: SessionTeamMembership[] = teamError ? [] : (teamData || []).map(item => ({
        teamId: item.team_id,
        teamName: item.team_name,
        role: item.role as 'manager' | 'technician' | 'requestor' | 'viewer',
        joinedDate: item.joined_date
      }));

      const updatedSessionData: SessionData = {
        ...sessionData,
        currentOrganizationId: organizationId,
        teamMemberships,
        lastUpdated: new Date().toISOString()
      };

      setSessionData(updatedSessionData);
      saveSessionToStorage(updatedSessionData);
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  const hasTeamRole = (teamId: string, role: string): boolean => {
    if (!sessionData) return false;
    const membership = sessionData.teamMemberships.find(tm => tm.teamId === teamId);
    return membership?.role === role;
  };

  const hasTeamAccess = (teamId: string): boolean => {
    if (!sessionData) return false;
    return sessionData.teamMemberships.some(tm => tm.teamId === teamId);
  };

  const canManageTeam = (teamId: string): boolean => {
    const currentOrg = getCurrentOrganization();
    if (!currentOrg) return false;
    
    const isOrgAdmin = ['owner', 'admin'].includes(currentOrg.userRole);
    const isTeamManager = hasTeamRole(teamId, 'manager');
    
    return isOrgAdmin || isTeamManager;
  };

  const getUserTeamIds = (): string[] => {
    if (!sessionData) return [];
    return sessionData.teamMemberships.map(tm => tm.teamId);
  };

  // Initialize session on mount or user change
  useEffect(() => {
    if (!user) {
      clearSession();
      setIsLoading(false);
      return;
    }

    // Try to load from storage first
    const cachedData = loadSessionFromStorage();
    if (cachedData) {
      console.log('Loaded session from storage');
      setSessionData(cachedData);
      setIsLoading(false);
      
      // Refresh in background
      refreshSession();
    } else {
      // No cached data, fetch fresh
      refreshSession();
    }
  }, [user]);

  return (
    <SessionContext.Provider value={{
      sessionData,
      isLoading,
      error,
      getCurrentOrganization,
      switchOrganization,
      hasTeamRole,
      hasTeamAccess,
      canManageTeam,
      getUserTeamIds,
      refreshSession,
      clearSession
    }}>
      {children}
    </SessionContext.Provider>
  );
};
