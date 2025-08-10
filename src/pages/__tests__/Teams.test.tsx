import React from 'react';
import { render, screen, fireEvent } from '@/test/utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Teams from '../Teams';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { TeamWithMembers } from '@/services/teamService';
import type { UnifiedPermissions } from '@/hooks/useUnifiedPermissions';

// Mock the TeamForm component
vi.mock('@/components/teams/TeamForm', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => 
    open ? (
      <div data-testid="team-form-modal">
        <button onClick={onClose}>Close Form</button>
      </div>
    ) : null
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock all contexts and hooks
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn()
}));

vi.mock('@/hooks/useTeamManagement', () => ({
  useTeams: vi.fn(),
  useTeamMutations: vi.fn()
}));

vi.mock('@/hooks/useUnifiedPermissions', () => ({
  useUnifiedPermissions: vi.fn()
}));

// Import mocks after setting up the mocks
import { useSession } from '@/hooks/useSession';
import { useTeams, useTeamMutations } from '@/hooks/useTeamManagement';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';

// Create stable mock functions
const mockUseSession = vi.fn();
const mockUseTeams = vi.fn();
const mockUseTeamMutations = vi.fn();
const mockUseUnifiedPermissions = vi.fn();

// Apply mocks to the actual imports
vi.mocked(useSession).mockImplementation(mockUseSession);
vi.mocked(useTeams).mockImplementation(mockUseTeams);
vi.mocked(useTeamMutations).mockImplementation(mockUseTeamMutations);
vi.mocked(useUnifiedPermissions).mockImplementation(mockUseUnifiedPermissions);

// Test data
const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  plan: 'premium' as const,
  userRole: 'admin' as const,
  memberCount: 5,
  maxMembers: 10,
  features: ['teams', 'equipment', 'workOrders'],
  userStatus: 'active' as const
};

const mockTeamWithMembers = {
  id: 'team-1',
  name: 'Engineering Team',
  description: 'Development and maintenance team',
  organization_id: 'org-1',
  member_count: 3,
  members: [
    {
      id: 'member-1',
      user_id: 'user-1',
      team_id: 'team-1',
      role: 'manager' as const,
      joined_date: '2024-01-01',
      profiles: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      }
    },
    {
      id: 'member-2',
      user_id: 'user-2',
      team_id: 'team-1',
      role: 'technician' as const,
      joined_date: '2024-01-02',
      profiles: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com'
      }
    },
    {
      id: 'member-3',
      user_id: 'user-3',
      team_id: 'team-1',
      role: 'requestor' as const,
      joined_date: '2024-01-03',
      profiles: {
        name: null,
        email: null
      }
    }
  ]
};

const renderTeamsPage = () => {
  return render(<Teams />);
};

describe('Teams Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseSession.mockReturnValue({
      getCurrentOrganization: () => mockOrganization,
      sessionData: { 
        organizations: [mockOrganization], 
        currentOrganizationId: 'org-1',
        teamMemberships: [],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: 1
      },
      isLoading: false,
      error: null,
      refreshSession: vi.fn(),
      clearSession: vi.fn(),
      switchOrganization: vi.fn(),
      hasTeamRole: vi.fn(),
      hasTeamAccess: vi.fn(),
      canManageTeam: vi.fn(),
      getUserTeamIds: vi.fn()
    });

    mockUseTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as unknown as UseQueryResult<TeamWithMembers[], Error>);

    mockUseTeamMutations.mockReturnValue({
      createTeamWithCreator: { mutate: vi.fn(), isPending: false },
      deleteTeam: { mutate: vi.fn(), isPending: false }
    } as unknown as ReturnType<typeof useTeamMutations>);

    mockUseUnifiedPermissions.mockReturnValue({
      context: { 
        userId: 'user-1', 
        organizationId: 'org-1',
        userRole: 'admin',
        teamMemberships: []
      },
      teams: {
        getPermissions: vi.fn().mockReturnValue({
          canView: true,
          canEdit: false,
          canDelete: false
        }),
        canCreateAny: true,
        canViewAll: true,
        canManageAny: false
      },
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      isTeamMember: vi.fn(),
      isTeamManager: vi.fn(),
      organization: {
        canManage: true,
        canInviteMembers: true,
        canViewBilling: true,
        canCreateTeams: true,
        canManageMembers: true
      },
      equipment: {
        getPermissions: vi.fn(),
        canCreateAny: true,
        canViewAll: true
      },
      workOrders: {
        getPermissions: vi.fn(),
        getDetailedPermissions: vi.fn(),
        canCreateAny: true,
        canViewAll: true,
        canAssignAny: true
      },
      getEquipmentNotesPermissions: vi.fn(),
      clearPermissionCache: vi.fn()
    } as unknown as UnifiedPermissions);
  });

  describe('Core Rendering', () => {
    it('displays loading state with skeleton cards', () => {
      mockUseTeams.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      // Should show loading content when teams are loading
      expect(screen.getByTestId('teams-loading')).toBeInTheDocument();
    });

    it('displays empty state when no teams exist', () => {
      mockUseTeams.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      expect(screen.getByText('No teams found')).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating your first team/)).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-create-team-button')).toBeInTheDocument();
    });

    it('displays teams grid with proper team information', () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      // Team information
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('Development and maintenance team')).toBeInTheDocument();
    });

    it('displays team members with proper information', () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      // Member names and emails
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      
      // Role badges
      expect(screen.getByText('manager')).toBeInTheDocument();
      expect(screen.getByText('technician')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('opens team form modal when create button is clicked', () => {
      mockUseTeams.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      const createButton = screen.getByTestId('empty-state-create-team-button');
      fireEvent.click(createButton);
      
      expect(screen.getByTestId('team-form-modal')).toBeInTheDocument();
    });

    it('navigates to team details when view details button is clicked', () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(viewDetailsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/teams/team-1');
    });

    it('shows delete confirmation dialog when delete button is clicked', async () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      // Mock permissions to allow deletion
      mockUseUnifiedPermissions.mockReturnValue({
        context: { 
          userId: 'user-1', 
          organizationId: 'org-1',
          userRole: 'admin',
          teamMemberships: []
        },
        teams: {
          getPermissions: vi.fn().mockReturnValue({
            canView: true,
            canEdit: true,
            canDelete: true
          }),
          canCreateAny: true,
          canViewAll: true,
          canManageAny: true
        },
        organization: {
          canManage: true,
          canInviteMembers: true,
          canViewBilling: true,
          canCreateTeams: true,
          canManageMembers: true
        },
        equipment: {
          getPermissions: vi.fn(),
          canCreateAny: true,
          canViewAll: true
        },
        workOrders: {
          getPermissions: vi.fn(),
          getDetailedPermissions: vi.fn(),
          canCreateAny: true,
          canViewAll: true,
          canAssignAny: true
        },
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
        isTeamMember: vi.fn(),
        isTeamManager: vi.fn(),
        getEquipmentNotesPermissions: vi.fn(),
        clearPermissionCache: vi.fn()
      } as unknown as UnifiedPermissions);

      renderTeamsPage();
      
      const deleteButton = screen.getByRole('button', { name: /delete team/i });
      fireEvent.click(deleteButton);
      
      // Should show confirmation dialog
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    });
  });

  describe('Permission Integration', () => {
    it('hides delete button when user lacks delete permission', () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      // Mock permissions to deny deletion
      mockUseUnifiedPermissions.mockReturnValue({
        context: { 
          userId: 'user-1', 
          organizationId: 'org-1',
          userRole: 'member',
          teamMemberships: []
        },
        teams: {
          getPermissions: vi.fn().mockReturnValue({
            canView: true,
            canEdit: false,
            canDelete: false
          }),
          canCreateAny: true,
          canViewAll: true,
          canManageAny: false
        },
        organization: {
          canManage: false,
          canInviteMembers: false,
          canViewBilling: false,
          canCreateTeams: false,
          canManageMembers: false
        },
        equipment: {
          getPermissions: vi.fn(),
          canCreateAny: true,
          canViewAll: true
        },
        workOrders: {
          getPermissions: vi.fn(),
          getDetailedPermissions: vi.fn(),
          canCreateAny: true,
          canViewAll: true,
          canAssignAny: true
        },
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
        isTeamMember: vi.fn(),
        isTeamManager: vi.fn(),
        getEquipmentNotesPermissions: vi.fn(),
        clearPermissionCache: vi.fn()
      } as unknown as UnifiedPermissions);

      renderTeamsPage();
      
      // Delete button should not be present
      expect(screen.queryByRole('button', { name: /delete team/i })).not.toBeInTheDocument();
      
      // View details button should still be present
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });

    it('shows delete button when user has delete permission', () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      // Mock permissions to allow deletion
      mockUseUnifiedPermissions.mockReturnValue({
        context: { 
          userId: 'user-1', 
          organizationId: 'org-1',
          userRole: 'admin',
          teamMemberships: []
        },
        teams: {
          getPermissions: vi.fn().mockReturnValue({
            canView: true,
            canEdit: true,
            canDelete: true
          }),
          canCreateAny: true,
          canViewAll: true,
          canManageAny: true
        },
        organization: {
          canManage: true,
          canInviteMembers: true,
          canViewBilling: true,
          canCreateTeams: true,
          canManageMembers: true
        },
        equipment: {
          getPermissions: vi.fn(),
          canCreateAny: true,
          canViewAll: true
        },
        workOrders: {
          getPermissions: vi.fn(),
          getDetailedPermissions: vi.fn(),
          canCreateAny: true,
          canViewAll: true,
          canAssignAny: true
        },
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
        isTeamMember: vi.fn(),
        isTeamManager: vi.fn(),
        getEquipmentNotesPermissions: vi.fn(),
        clearPermissionCache: vi.fn()
      } as unknown as UnifiedPermissions);

      renderTeamsPage();
      
      // Delete button should be present
      expect(screen.getByRole('button', { name: /delete team/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('handles missing profile data with proper fallbacks', () => {
      mockUseTeams.mockReturnValue({
        data: [mockTeamWithMembers],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as unknown as UseQueryResult<TeamWithMembers[], Error>);

      renderTeamsPage();
      
      // Member with missing profile data should show fallbacks
      expect(screen.getByText('Unknown User')).toBeInTheDocument();
      expect(screen.getByText('No email')).toBeInTheDocument();
    });

    it('handles organization loading state', () => {
      mockUseSession.mockReturnValue({
        getCurrentOrganization: () => null,
        sessionData: null,
        isLoading: true,
        error: null,
        refreshSession: vi.fn(),
        clearSession: vi.fn(),
        switchOrganization: vi.fn(),
        hasTeamRole: vi.fn(),
        hasTeamAccess: vi.fn(),
        canManageTeam: vi.fn(),
        getUserTeamIds: vi.fn()
      });
      
      renderTeamsPage();
      
      // Should show loading when organization is loading
      expect(screen.getByTestId('teams-loading')).toBeInTheDocument();
    });

    it('handles no organization selected', () => {
      mockUseSession.mockReturnValue({
        getCurrentOrganization: () => null,
        sessionData: { 
          organizations: [], 
          currentOrganizationId: null,
          teamMemberships: [],
          lastUpdated: '2024-01-01T00:00:00Z',
          version: 1
        },
        isLoading: false,
        error: null,
        refreshSession: vi.fn(),
        clearSession: vi.fn(),
        switchOrganization: vi.fn(),
        hasTeamRole: vi.fn(),
        hasTeamAccess: vi.fn(),
        canManageTeam: vi.fn(),
        getUserTeamIds: vi.fn()
      });

      renderTeamsPage();
      
      // Should show loading when no organization is selected
      expect(screen.getByTestId('teams-loading')).toBeInTheDocument();
    });
  });
});