// Mock providers file to avoid react-refresh warnings
import React from 'react';
import { SessionContext } from '@/contexts/SessionContext';

// Mock SessionContext value
const mockSessionContextValue = {
  sessionData: {
    user: { id: 'user-1', email: 'test@example.com' },
    organizations: [{ 
      id: 'org-1', 
      name: 'Test Org',
      plan: 'free' as const,
      memberCount: 1,
      maxMembers: 10,
      features: [],
      billingEmail: 'test@example.com',
      isOwner: true,
      userRole: 'admin' as const,
      userStatus: 'active' as const
    }],
    teamMemberships: [],
    currentOrganization: { 
      id: 'org-1', 
      name: 'Test Org',
      plan: 'free' as const,
      memberCount: 1,
      maxMembers: 10,
      features: [],
      billingEmail: 'test@example.com',
      isOwner: true,
      userRole: 'admin' as const,
      userStatus: 'active' as const
    },
    currentOrganizationId: 'org-1',
    lastUpdated: Date.now(),
    version: 1
  },
  isLoading: false,
  error: null,
  getCurrentOrganization: () => ({ 
    id: 'org-1', 
    name: 'Test Org',
    plan: 'free' as const,
    memberCount: 1,
    maxMembers: 10,
    features: [],
    billingEmail: 'test@example.com',
    isOwner: true,
    userRole: 'admin' as const,
    userStatus: 'active' as const
  }),
  switchOrganization: () => Promise.resolve(),
  hasTeamRole: () => false,
  hasTeamAccess: () => false,
  canManageTeam: () => false,
  getUserTeamIds: () => [],
  refreshSession: () => Promise.resolve(),
  clearSession: () => {}
};

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-auth-provider">{children}</div>
);

export const MockSessionProvider = ({ children }: { children: React.ReactNode }) => (
  <SessionContext.Provider value={mockSessionContextValue}>
    <div data-testid="mock-session-provider">{children}</div>
  </SessionContext.Provider>
);

export const MockUserProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-user-provider">{children}</div>
);

export const MockSimpleOrganizationProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-organization-provider">{children}</div>
);

export const MockSessionProvider2 = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-session-provider-2">{children}</div>
);