import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useSupabaseData', () => {
  return {
    useCreateEquipment: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useUpdateEquipment: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

vi.mock('@/contexts/SimpleOrganizationContext', () => ({
  useSimpleOrganization: () => ({ currentOrganization: { id: 'org-1', name: 'Org 1' } }),
}));

import { useEquipmentForm } from '@/hooks/useEquipmentForm';
import { useCreateEquipment, useUpdateEquipment } from '@/hooks/useSupabaseData';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

const createWrapper = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

type FormValues = {
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  installation_date: string;
  warranty_expiration: string;
  last_maintenance: string;
  notes: string;
  custom_attributes: Record<string, unknown>;
  image_url: string;
  last_known_location: string | null;
  team_id?: string | null;
};

// Simple shape of our mocked mutation object
type MutationMock = { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };

// Derive the equipment prop type from the hook signature
type UseEquipmentFormPropsType = Parameters<typeof useEquipmentForm>[0];
type EquipmentProp = UseEquipmentFormPropsType['equipment'];

const baseValues: FormValues = {
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
  });

  it('prevents submit when permission denied', async () => {
vi.mocked(usePermissions).mockReturnValue({
  canManageEquipment: () => false,
  hasRole: () => false,
} as unknown as ReturnType<typeof usePermissions>);

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
const createMock = vi.mocked(useCreateEquipment).mock.results[0]!.value as MutationMock;
const updateMock = vi.mocked(useUpdateEquipment).mock.results[0]!.value as MutationMock;
    expect(createMock.mutateAsync).not.toHaveBeenCalled();
    expect(updateMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('requires team assignment for non-admin users', async () => {
vi.mocked(usePermissions).mockReturnValue({
  canManageEquipment: () => true,
  hasRole: () => false,
});

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
    const createMock = (useCreateEquipment as any).mock.results[0].value;
    expect(createMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates equipment successfully', async () => {
vi.mocked(usePermissions).mockReturnValue({
  canManageEquipment: () => true,
  hasRole: () => false, // non-admin but team assigned -> allowed
});

    const client = new QueryClient();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: undefined, onClose })
    , { wrapper: createWrapper(client) });

    const createMock = vi.mocked(useCreateEquipment).mock.results[0]!.value as MutationMock;

    await act(async () => {
      await result.current.onSubmit({ ...baseValues, team_id: 'team-1' });
    });

    expect(createMock.mutateAsync).toHaveBeenCalledWith(
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
    const equipment: { id: string } = { id: 'eq-1' };

    const { result } = renderHook(() =>
      useEquipmentForm({ equipment, onClose })
    , { wrapper: createWrapper(client) });

    const updateMock = vi.mocked(useUpdateEquipment).mock.results[0]!.value as MutationMock;

    await act(async () => {
      await result.current.onSubmit({ ...baseValues });
    });

    expect(updateMock.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: 'eq-1',
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard-stats'] });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error toast when editing without id', async () => {
    const client = new QueryClient();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: {} as unknown as { id: string }, onClose: vi.fn() })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues });
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Update Failed' })
    );
  });
});
