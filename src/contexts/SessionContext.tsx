import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { 
  saveOrganizationPreference, 
  getOrganizationPreference, 
  clearOrganizationPreference,
  shouldRefreshSession,
  getSessionStorageKey,
  getSessionVersion
} from '@/utils/sessionPersistence';

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

const SESSION_STORAGE_KEY = getSessionStorageKey();
const SESSION_VERSION = getSessionVersion();

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  const loadSessionFromStorage = useCallback((): SessionData | null => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Check version compatibility - force refresh due to RLS changes
      if (parsed.version !== SESSION_VERSION) {
        console.log('🔄 Session version updated, clearing stored data');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      
      // Use more lenient cache time for better user experience
      const lastUpdated = new Date(parsed.lastUpdated);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdated < oneHourAgo) {
        console.log('⏰ Session data is older than 1 hour, will refresh on next fetch');
        // Don't clear immediately, but mark for refresh
        return parsed;
      }
      
      return parsed;
    } catch (error) {
      console.error('💥 Error loading session from storage:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }, []);

  const saveSessionToStorage = useCallback((data: SessionData) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('💾 Error saving session to storage:', error);
    }
  }, []);

  const fetchSessionData = async (): Promise<SessionData> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Fetching session data for user:', user.id);

    // Fetch user's organization memberships
    const { data: orgMemberData, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('organization_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (orgMemberError) {
      console.error('❌ Error fetching organization memberships:', orgMemberError);
      throw new Error(`Failed to fetch memberships: ${orgMemberError.message}`);
    }

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

    // Get organization IDs and fetch details
    const orgIds = orgMemberData.map(om => om.organization_id);
    console.log('🏢 Fetching organization details for IDs:', orgIds);

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds);

    if (orgError) {
      console.error('❌ Error fetching organizations:', orgError);
      throw new Error(`Failed to fetch organizations: ${orgError.message}`);
    }

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

    // Determine current organization with improved logic
    let currentOrganizationId = organizations.length > 0 ? organizations[0].id : null;
    
    // Check user preference first
    const userPreference = getOrganizationPreference();
    if (userPreference?.selectedOrgId && organizations.find(org => org.id === userPreference.selectedOrgId)) {
      console.log('🎯 Using user preference for organization:', userPreference.selectedOrgId);
      currentOrganizationId = userPreference.selectedOrgId;
    } else {
      // Fallback to stored session data
      const storedData = loadSessionFromStorage();
      if (storedData?.currentOrganizationId && organizations.find(org => org.id === storedData.currentOrganizationId)) {
        console.log('📦 Using stored session organization:', storedData.currentOrganizationId);
        currentOrganizationId = storedData.currentOrganizationId;
      }
    }

    // Fetch team memberships
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
        } else {
          teamMemberships = (teamData || []).map(item => ({
            teamId: item.team_id,
            teamName: item.team_name,
            role: item.role as 'manager' | 'technician' | 'requestor' | 'viewer',
            joinedDate: item.joined_date
          }));
        }
      } catch (teamFetchError) {
        console.error('❌ Failed to fetch team memberships:', teamFetchError);
      }
    }

    const sessionData: SessionData = {
      organizations,
      currentOrganizationId,
      teamMemberships,
      lastUpdated: new Date().toISOString(),
      version: SESSION_VERSION
    };

    console.log('🎉 Session data fetched successfully!', sessionData);
    return sessionData;
  };

  const refreshSession = useCallback(async (force: boolean = false) => {
    if (!user) {
      setSessionData(null);
      setIsLoading(false);
      return;
    }

    // Check if we should refresh based on timing
    if (!force && lastRefreshTime && !shouldRefreshSession(lastRefreshTime)) {
      console.log('⏭️ Skipping session refresh - too recent');
      return;
    }

    try {
      setError(null);
      if (force) setIsLoading(true);
      
      const newSessionData = await fetchSessionData();
      setSessionData(newSessionData);
      saveSessionToStorage(newSessionData);
      setLastRefreshTime(new Date().toISOString());
    } catch (err) {
      console.error('💥 Error refreshing session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session';
      setError(errorMessage);
      
      // Try to use cached data if available and compatible
      if (!force) {
        const cachedData = loadSessionFromStorage();
        if (cachedData && cachedData.version === SESSION_VERSION) {
          console.log('📦 Using cached session data due to error');
          setSessionData(cachedData);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, lastRefreshTime, loadSessionFromStorage, saveSessionToStorage]);

  const clearSession = useCallback(() => {
    setSessionData(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    clearOrganizationPreference();
  }, []);

  const getCurrentOrganization = useCallback((): SessionOrganization | null => {
    if (!sessionData?.currentOrganizationId) return null;
    return sessionData.organizations.find(org => org.id === sessionData.currentOrganizationId) || null;
  }, [sessionData]);

  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!sessionData || !user) return;
    
    const organization = sessionData.organizations.find(org => org.id === organizationId);
    if (!organization) {
      console.warn('Organization not found:', organizationId);
      return;
    }

    console.log('🔄 Switching to organization:', organizationId);
    
    // Save user preference immediately
    saveOrganizationPreference(organizationId);
    
    try {
      // Fetch team memberships for the new organization
      const { data: teamData, error: teamError } = await supabase
        .rpc('get_user_team_memberships', {
          user_uuid: user.id,
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
  }, [sessionData, user, saveSessionToStorage]);

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
    const isTeamManager = sessionData?.teamMemberships.find(tm => tm.teamId === teamId)?.role === 'manager';
    
    return isOrgAdmin || isTeamManager;
  };

  const getUserTeamIds = (): string[] => {
    if (!sessionData) return [];
    return sessionData.teamMemberships.map(tm => tm.teamId);
  };

  // Page visibility handling
  usePageVisibility({
    onVisibilityChange: (isVisible) => {
      if (isVisible && user) {
        console.log('👁️ Page became visible, checking session freshness');
        // Only refresh if it's been a while since last refresh
        if (lastRefreshTime && shouldRefreshSession(lastRefreshTime)) {
          console.log('🔄 Refreshing session due to page visibility change');
          refreshSession(false);
        }
      }
    },
    debounceMs: 1000 // Debounce visibility changes
  });

  // Initialize session on mount or user change
  useEffect(() => {
    if (!user) {
      clearSession();
      setIsLoading(false);
      return;
    }

    // Try to load from cache first
    const cachedData = loadSessionFromStorage();
    if (cachedData && cachedData.version === SESSION_VERSION) {
      console.log('📦 Loading session from cache');
      setSessionData(cachedData);
      setIsLoading(false);
      
      // Refresh in background if needed
      if (shouldRefreshSession(cachedData.lastUpdated)) {
        console.log('🔄 Background refresh needed');
        refreshSession(false);
      }
    } else {
      console.log('🔄 No valid cache, fetching fresh session data');
      refreshSession(true);
    }
  }, [user, loadSessionFromStorage, refreshSession]);

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
