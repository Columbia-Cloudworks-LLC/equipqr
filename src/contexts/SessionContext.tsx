import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useSessionManager } from '@/hooks/useSessionManager';
import { SessionStorageService } from '@/services/sessionStorageService';
import { SessionPermissionService } from '@/services/sessionPermissionService';

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

export { SessionContext };

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionManager = useSessionManager({
    user,
    onSessionUpdate: setSessionData,
    onError: setError
  });

  const clearSession = useCallback(() => {
    setSessionData(null);
    SessionStorageService.clearSessionStorage();
  }, []);

  const getCurrentOrganization = useCallback((): SessionOrganization | null => {
    return SessionPermissionService.getCurrentOrganization(sessionData);
  }, [sessionData]);

  const switchOrganization = useCallback(async (organizationId: string) => {
    await sessionManager.switchOrganization(organizationId, sessionData);
  }, [sessionManager, sessionData]);

  const hasTeamRole = useCallback((teamId: string, role: string): boolean => {
    return SessionPermissionService.hasTeamRole(sessionData, teamId, role);
  }, [sessionData]);

  const hasTeamAccess = useCallback((teamId: string): boolean => {
    return SessionPermissionService.hasTeamAccess(sessionData, teamId);
  }, [sessionData]);

  const canManageTeam = useCallback((teamId: string): boolean => {
    const currentOrg = getCurrentOrganization();
    return SessionPermissionService.canManageTeam(sessionData, currentOrg, teamId);
  }, [sessionData, getCurrentOrganization]);

  const getUserTeamIds = useCallback((): string[] => {
    return SessionPermissionService.getUserTeamIds(sessionData);
  }, [sessionData]);

  const refreshSession = useCallback(async (force: boolean = false) => {
    setIsLoading(force);
    await sessionManager.refreshSession(force);
    setIsLoading(false);
  }, [sessionManager]);

  // Page visibility handling - more conservative approach
  usePageVisibility({
    onVisibilityChange: (isVisible) => {
      if (sessionManager.shouldRefreshOnVisibility(isVisible)) {
        // Refreshing session due to page visibility change
        refreshSession(false);
      }
    },
    debounceMs: 2000 // Increased debounce for better performance
  });

  // Initialize session on mount or user change
  useEffect(() => {
    const { shouldLoadFromCache, cachedData, needsRefresh } = sessionManager.initializeSession();
    
    if (shouldLoadFromCache && cachedData) {
      // Loading session from cache
      setSessionData(cachedData);
      setIsLoading(false);
      
      // Refresh in background if needed
      if (needsRefresh) {
        // Background refresh needed
        refreshSession(false);
      }
    } else {
      // No valid cache, fetching fresh session data
      refreshSession(true);
    }
  }, [user, sessionManager, refreshSession]);

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
