import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissions } from '../usePermissions';

// Mock the dependencies
vi.mock('@/contexts/SimpleOrganizationContext', () => ({
  useSimpleOrganization: vi.fn()
}));

vi.mock('@/contexts/UserContext', () => ({
  useUser: vi.fn()
}));

import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useUser } from '@/contexts/UserContext';

const mockUseSimpleOrganization = useSimpleOrganization as ReturnType<typeof vi.fn>;
const mockUseUser = useUser as ReturnType<typeof vi.fn>;

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

  const createMockUser = () => ({
    id: 'user-1',
    email: 'test@example.com'
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('admin')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(true);
    });

    it('should return false for non-matching role', () => {
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('member')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasRole(['admin'])).toBe(false);
    });

    it('should return true if user has any of the specified roles', () => {
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
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('admin')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canManageEquipment()).toBe(true);
    });

    it('should return false for view-only role', () => {
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
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('technician')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canManageWorkOrder()).toBe(true);
    });

    it('should return false for viewer role', () => {
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
      mockUseSimpleOrganization.mockReturnValue({
        currentOrganization: createMockOrganization('owner')
      });
      mockUseUser.mockReturnValue({ user: createMockUser() });

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateTeam()).toBe(true);
    });

    it('should return false for member role', () => {
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