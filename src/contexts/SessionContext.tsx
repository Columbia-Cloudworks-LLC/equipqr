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
  logo?: string;
  backgroundColor?: string;
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
const SESSION_VERSION = 2; // Incremented due to RLS policy updates

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
      
      // Check version compatibility - force refresh due to RLS changes
      if (parsed.version !== SESSION_VERSION) {
        console.log('🔄 Session version updated due to RLS policy changes, clearing stored data');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      
      // Check if data is recent (less than 30 minutes due to security updates)
      const lastUpdated = new Date(parsed.lastUpdated);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      if (lastUpdated < thirtyMinutesAgo) {
        console.log('⏰ Session data expired due to security updates, will refresh');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('💥 Error loading session from storage:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  };

  const saveSessionToStorage = (data: SessionData) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('💾 Error saving session to storage:', error);
    }
  };

  const fetchSessionData = async (): Promise<SessionData> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Starting fresh session data fetch with minimal RLS policies for user:', user.id);

    // Fetch user's organization memberships - now works with minimal RLS that only shows own memberships
    console.log('📋 Fetching organization memberships with minimal RLS...');
    const { data: orgMemberData, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('organization_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (orgMemberError) {
      console.error('❌ Error fetching organization memberships:', orgMemberError);
      throw new Error(`Failed to fetch memberships: ${orgMemberError.message}`);
    }

    console.log('✅ Organization memberships fetched successfully:', orgMemberData?.length || 0);

    if (!orgMemberData || orgMemberData.length === 0) {
      console.log('⚠️ No organization memberships found for user');
      return {
        organizations: [],
        currentOrganizationId: null,
        teamMemberships: [],
        lastUpdated: new Date().toISOString(),
        version: SESSION_VERSION
      };
    }

    // Get organization IDs and fetch details using updated RLS policy
    const orgIds = orgMemberData.map(om => om.organization_id);
    console.log('🏢 Fetching organization details for IDs:', orgIds);

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds);

    if (orgError) {
      console.error('❌ Error fetching organizations with new RLS:', orgError);
      throw new Error(`Failed to fetch organizations: ${orgError.message}`);
    }

    console.log('✅ Organizations fetched successfully with new RLS:', orgData?.length || 0);

    // Combine organization data with user roles
    const organizations: SessionOrganization[] = (orgData || []).map(org => {
      const membership = orgMemberData.find(om => om.organization_id === org.id);
      return {
        id: org.id,
        name: org.name,
        plan: org.plan as 'free' | 'premium',
        memberCount: org.member_count,
        maxMembers: org.max_members,
        features: org.features,
        billingCycle: org.billing_cycle as 'monthly' | 'yearly' | undefined,
        nextBillingDate: org.next_billing_date || undefined,
        logo: org.logo || undefined,
        backgroundColor: org.background_color || undefined,
        userRole: membership?.role as 'owner' | 'admin' | 'member' || 'member',
        userStatus: membership?.status as 'active' | 'pending' | 'inactive' || 'active'
      };
    });

    // Get current organization
    const storedData = loadSessionFromStorage();
    let currentOrganizationId = organizations.length > 0 ? organizations[0].id : null;
    
    if (storedData?.currentOrganizationId && organizations.find(org => org.id === storedData.currentOrganizationId)) {
      currentOrganizationId = storedData.currentOrganizationId;
    }

    // Fetch team memberships using the security function
    let teamMemberships: SessionTeamMembership[] = [];
    
    if (currentOrganizationId) {
      console.log('👥 Fetching team memberships for organization:', currentOrganizationId);
      try {
        const { data: teamData, error: teamError } = await supabase
          .rpc('get_user_team_memberships', {
            user_uuid: user.id,
            org_id: currentOrganizationId
          });

        if (teamError) {
          console.error('⚠️ Error fetching team memberships:', teamError);
          // Don't throw, just continue without team data
        } else {
          console.log('✅ Team memberships fetched successfully:', teamData?.length || 0);
          teamMemberships = (teamData || []).map(item => ({
            teamId: item.team_id,
            teamName: item.team_name,
            role: item.role as 'manager' | 'technician' | 'requestor' | 'viewer',
            joinedDate: item.joined_date
          }));
        }
      } catch (teamFetchError) {
        console.error('❌ Failed to fetch team memberships:', teamFetchError);
        // Continue without team data rather than failing entirely
      }
    }

    const sessionData: SessionData = {
      organizations,
      currentOrganizationId,
      teamMemberships,
      lastUpdated: new Date().toISOString(),
      version: SESSION_VERSION
    };

    console.log('🎉 Session data fetched successfully with updated RLS!', sessionData);
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
      console.error('💥 Error refreshing session with new RLS:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session';
      setError(errorMessage);
      
      // Try to use cached data if available (but only if it's compatible)
      const cachedData = loadSessionFromStorage();
      if (cachedData && cachedData.version === SESSION_VERSION) {
        console.log('📦 Using compatible cached session data due to error');
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

    console.log('🔄 Switching to organization:', organizationId);
    
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
        lastUpdated: new Date().toISOString(),
        version: SESSION_VERSION
      };

      setSessionData(updatedSessionData);
      saveSessionToStorage(updatedSessionData);
    } catch (error) {
      console.error('💥 Error switching organization:', error);
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

  // Initialize session on mount or user change - force refresh due to RLS updates
  useEffect(() => {
    if (!user) {
      clearSession();
      setIsLoading(false);
      return;
    }

    // Clear any cached data to ensure we test the new RLS policies
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('🔄 Forcing fresh session data fetch to validate updated RLS policies');
    
    // Fetch fresh data with updated RLS
    refreshSession();
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
