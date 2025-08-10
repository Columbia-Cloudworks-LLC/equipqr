import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissions } from '../usePermissions';

// Mock the dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn()
  }))
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSession: vi.fn(() => ({
    sessionData: {
      user: { id: 'user-1' },
      session: { access_token: 'token' }
    },
    isLoading: false,
    error: null,
    getCurrentOrganization: vi.fn(() => ({
      id: 'org-1',
      name: 'Test Organization',
      userRole: 'admin'
    })),
    getUserTeamIds: vi.fn(() => []),
    hasTeamAccess: vi.fn(() => false),
    canManageTeam: vi.fn(() => false)
  }))
}));

vi.mock('@/contexts/SimpleOrganizationContext', () => ({
  useSimpleOrganization: vi.fn()
}));

vi.mock('@/contexts/UserContext', () => ({
  useUser: vi.fn()
}));

import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useUser } from '@/contexts/UserContext';
import { useSession } from '@/contexts/SessionContext';

// Mock the permission engine
vi.mock('@/services/permissions/PermissionEngine', () => ({
  permissionEngine: {
    hasPermission: vi.fn((permission: string, context: { userRole?: string; organizationId?: string; teamId?: string }) => {
      const role = context.userRole;
      
      if (permission === 'workorder.edit') {
        return ['admin', 'technician', 'manager'].includes(role);
      }
      if (permission === 'equipment.edit') {
        return ['admin', 'owner', 'manager'].includes(role);
      }
      if (permission === 'team.create') {
        return ['owner', 'admin'].includes(role);
      }
      
      return false;
    }),
    clearCache: vi.fn()
  }
}));

const mockUseSimpleOrganization = useSimpleOrganization as ReturnType<typeof vi.fn>;
const mockUseUser = useUser as ReturnType<typeof vi.fn>;
const mockUseSession = useSession as ReturnType<typeof vi.fn>;

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockOrganization = (role: string = 'member') => ({
    id: 'org-1',
    name: 'Test Organization',
    members: [
      {
        id: 'user-1',
        email: 'test@example.com',
        role,
        organization_id: 'org-1'
      }
    ]
  });

  const updateSessionMockForRole = (role: string) => {
    mockUseSession.mockReturnValue({
      sessionData: {
        user: { id: 'user-1' },
        session: { access_token: 'token' }
      },
      isLoading: false,
      error: null,
      getCurrentOrganization: vi.fn(() => ({
        id: 'org-1',
        name: 'Test Organization',
        userRole: role
      })),
      getUserTeamIds: vi.fn(() => []),
      hasTeamAccess: vi.fn(() => false),
      canManageTeam: vi.fn(() => false)
    });
  };

  const createMockUser = () => ({
    id: 'user-1',
    email: 'test@example.com'
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      updateSessionMockForRole('admin');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('admin')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(true);
    });

    it('should return false for non-matching role', () => {
      updateSessionMockForRole('member');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('member')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(false);
    });

    it('should return true if user has any of the specified roles', () => {
      updateSessionMockForRole('admin');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('admin')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin', 'owner'])).toBe(true);
    });
  });

  describe('canManageEquipment', () => {
    it('should return true for admin role', () => {
      updateSessionMockForRole('admin');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('admin')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canManageEquipment()).toBe(true);
    });

    it('should return false for view-only role', () => {
      updateSessionMockForRole('viewer');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('viewer')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canManageEquipment()).toBe(false);
    });
  });

  describe('canManageWorkOrder', () => {
    it('should return true for technician role', () => {
      updateSessionMockForRole('technician');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('technician')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canManageWorkOrder()).toBe(true);
    });

    it('should return false for viewer role', () => {
      updateSessionMockForRole('viewer');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('viewer')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canManageWorkOrder()).toBe(false);
    });
  });

  describe('canCreateTeam', () => {
    it('should return true for owner role', () => {
      updateSessionMockForRole('owner');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('owner')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateTeam()).toBe(true);
    });

    it('should return false for member role', () => {
      updateSessionMockForRole('member');
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('member')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateTeam()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle missing user', () => {
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('admin')
      });
      mockUseUser.mockReturnValue({ user: null });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(false);
    });

    it('should handle missing organization', () => {
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: null
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(false);
    });

    it('should handle empty members array', () => {
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: {
          ...createMockOrganization('admin'),
          members: []
        }
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(false);
    });
  });
});