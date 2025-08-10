import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { SessionData, SessionTeamMembership, SessionOrganization } from '@/contexts/SessionContext';
import { SessionDataService } from '@/services/sessionDataService';
import { SessionStorageService } from '@/services/sessionStorageService';
import { getOrganizationPreference, saveOrganizationPreference, shouldRefreshSession, getSessionVersion } from '@/utils/sessionPersistence';

interface UseSessionManagerProps {
  user: User | null;
  onSessionUpdate: (data: SessionData) => void;
  onError: (error: string) => void;
}

export const useSessionManager = ({ user, onSessionUpdate, onError }: UseSessionManagerProps) => {
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  const createSessionData = useCallback((
    organizations: SessionOrganization[],
    currentOrganizationId: string | null,
    teamMemberships: SessionTeamMembership[]
  ): SessionData => {
    return {
      organizations,
      currentOrganizationId,
      teamMemberships,
      lastUpdated: new Date().toISOString(),
      version: getSessionVersion()
    };
  }, []);

  const refreshSession = useCallback(async (force: boolean = false) => {
    if (!user) {
      onSessionUpdate({
        organizations: [],
        currentOrganizationId: null,
        teamMemberships: [],
        lastUpdated: new Date().toISOString(),
        version: getSessionVersion()
      });
      return;
    }

    // More conservative refresh timing to prevent unnecessary API calls
    if (!force && lastRefreshTime) {
      const lastRefresh = new Date(lastRefreshTime);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastRefresh > fiveMinutesAgo) {
        console.log('⏭️ Skipping session refresh - refreshed within last 5 minutes');
        return;
      }
    }

    try {
      onError('');
      
      const userPreference = getOrganizationPreference();
      const storedData = SessionStorageService.loadSessionFromStorage();
      
      const { organizations, currentOrganizationId, teamMemberships } = 
        await SessionDataService.fetchSessionData(
          user.id,
          userPreference?.selectedOrgId,
          storedData?.currentOrganizationId
        );

      const newSessionData = createSessionData(organizations, currentOrganizationId, teamMemberships);
      
      onSessionUpdate(newSessionData);
      SessionStorageService.saveSessionToStorage(newSessionData);
      setLastRefreshTime(new Date().toISOString());
    } catch (err) {
      console.error('💥 Error refreshing session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session';
      onError(errorMessage);
      
      // Try to use cached data if available and compatible
      if (!force) {
        const cachedData = SessionStorageService.loadSessionFromStorage();
        if (cachedData && SessionStorageService.isSessionVersionValid(cachedData)) {
          console.log('📦 Using cached session data due to error');
          onSessionUpdate(cachedData);
        }
      }
    }
  }, [user, lastRefreshTime, onSessionUpdate, onError, createSessionData]);

  const switchOrganization = useCallback(async (
    organizationId: string,
    sessionData: SessionData | null
  ) => {
    if (!sessionData || !user) return;
    
    const organization = sessionData.organizations.find(org => org.id === organizationId);
    if (!organization) {
      console.warn('❌ Organization not found:', organizationId);
      throw new Error(`Organization ${organizationId} not found in user's organizations`);
    }

    console.log('🔄 Switching to organization:', organizationId, organization.name);
    
    // Save user preference immediately
    saveOrganizationPreference(organizationId);
    
    try {
      // Fetch team memberships for the new organization
      const teamMemberships = await SessionDataService.fetchTeamMemberships(user.id, organizationId);

      const updatedSessionData = createSessionData(
        sessionData.organizations,
        organizationId,
        teamMemberships
      );

      onSessionUpdate(updatedSessionData);
      SessionStorageService.saveSessionToStorage(updatedSessionData);
    } catch (error) {
      console.error('💥 Error switching organization:', error);
    }
  }, [user, onSessionUpdate, createSessionData]);

  const shouldRefreshOnVisibility = useCallback((isVisible: boolean): boolean => {
    if (!isVisible || !user || !lastRefreshTime) return false;
    
    const lastRefresh = new Date(lastRefreshTime);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    return lastRefresh < thirtyMinutesAgo;
  }, [user, lastRefreshTime]);

  const initializeSession = useCallback(() => {
    if (!user) {
      SessionStorageService.clearSessionStorage();
      return { shouldLoadFromCache: false, cachedData: null };
    }

    // Try to load from cache first
    const cachedData = SessionStorageService.loadSessionFromStorage();
    if (cachedData && SessionStorageService.isSessionVersionValid(cachedData)) {
      console.log('📦 Loading session from cache');
      
      const needsRefresh = shouldRefreshSession(cachedData.lastUpdated);
      return { shouldLoadFromCache: true, cachedData, needsRefresh };
    }
    
    console.log('🔄 No valid cache, fetching fresh session data');
    return { shouldLoadFromCache: false, cachedData: null };
  }, [user]);

  return {
    refreshSession,
    switchOrganization,
    shouldRefreshOnVisibility,
    initializeSession
  };
};