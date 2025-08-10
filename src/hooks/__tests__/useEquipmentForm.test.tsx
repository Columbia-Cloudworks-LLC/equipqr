import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create stable mock objects
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('@/hooks/useSupabaseData', () => {
  return {
    useCreateEquipment: vi.fn(() => ({ mutateAsync: mockCreateMutateAsync, isPending: false })),
    useUpdateEquipment: vi.fn(() => ({ mutateAsync: mockUpdateMutateAsync, isPending: false })),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    canManageEquipment: () => true,
    hasRole: () => true,
  })),
}));

vi.mock('@/hooks/useSimpleOrganization', () => ({
  useSimpleOrganization: () => ({ currentOrganization: { id: 'org-1', name: 'Org 1' } }),
}));

import { useEquipmentForm } from '@/hooks/useEquipmentForm';
import { useCreateEquipment, useUpdateEquipment } from '@/hooks/useSupabaseData';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { EquipmentFormData, EquipmentRecord } from '@/types/equipment';

const createWrapper = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

// Simple shape of our mocked mutation object
type MutationMock = { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };

// Helper to create complete usePermissions mock
const createPermissionsMock = (overrides: Partial<ReturnType<typeof usePermissions>> = {}) => ({
  canManageTeam: () => true,
  canViewTeam: () => true,
  canCreateTeam: () => true,
  canManageEquipment: () => true,
  canViewEquipment: () => true,
  canCreateEquipment: () => true,
  canUpdateEquipmentStatus: () => true,
  canManageWorkOrder: () => true,
  canViewWorkOrder: () => true,
  canCreateWorkOrder: () => true,
  canAssignWorkOrder: () => true,
  canChangeWorkOrderStatus: () => true,
  canManageOrganization: () => true,
  canInviteMembers: () => true,
  hasRole: () => true,
  isTeamMember: () => true,
  isTeamManager: () => true,
  ...overrides,
});

// Helper to create mock equipment
const createMockEquipment = (overrides: Partial<EquipmentRecord> = {}): EquipmentRecord => ({
  id: 'eq-1',
  name: 'Test Equipment',
  manufacturer: 'Test Manufacturer',
  model: 'Test Model',
  serial_number: 'TEST123',
  status: 'active',
  location: 'Test Location',
  installation_date: '2025-01-01',
  warranty_expiration: null,
  last_maintenance: null,
  notes: null,
  custom_attributes: {},
  image_url: null,
  last_known_location: null,
  team_id: null,
  organization_id: 'org-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  working_hours: 0,
  ...overrides,
});

const baseValues: EquipmentFormData = {
  name: 'Eq Name',
  manufacturer: 'Acme',
  model: 'X1',
  serial_number: 'SN',
  status: 'active',
  location: 'NY',
  installation_date: '2025-01-01',
  warranty_expiration: '',
  last_maintenance: '',
  notes: '',
  custom_attributes: {},
  image_url: '',
  last_known_location: null,
  team_id: 'team-1',
};

describe('useEquipmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockClear();
    mockUpdateMutateAsync.mockClear();
  });

  it('prevents submit when permission denied', async () => {
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock({
      canManageEquipment: () => false,
      hasRole: () => false,
    }));

    const client = new QueryClient();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: undefined, onClose: vi.fn() })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues });
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Permission Denied' })
    );
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('requires team assignment for non-admin users', async () => {
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock({
      canManageEquipment: () => true,
      hasRole: () => false,
    }));

    const client = new QueryClient();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: undefined, onClose: vi.fn() })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues, team_id: 'unassigned' });
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Team Assignment Required' })
    );
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('creates equipment successfully', async () => {
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock({
      canManageEquipment: () => true,
      hasRole: () => false, // non-admin but team assigned -> allowed
    }));

    const client = new QueryClient();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: undefined, onClose })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues, team_id: 'team-1' });
    });

    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Eq Name',
        manufacturer: 'Acme',
        working_hours: 0,
        team_id: 'team-1',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('updates equipment successfully and invalidates queries', async () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const onClose = vi.fn();
    const equipment = createMockEquipment({ id: 'eq-1' });

    const { result } = renderHook(() =>
      useEquipmentForm({ equipment, onClose })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues });
    });

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: 'eq-1',
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard-stats'] });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error toast when editing without id', async () => {
    const client = new QueryClient();
    const invalidEquipment = createMockEquipment({ id: '' }); // Invalid id
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: invalidEquipment, onClose: vi.fn() })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues });
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Update Failed' })
    );
  });
});
