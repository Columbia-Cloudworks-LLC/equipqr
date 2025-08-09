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

const createWrapper = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

const baseValues = {
  name: 'Eq Name',
  manufacturer: 'Acme',
  model: 'X1',
  serial_number: 'SN',
  status: 'active' as const,
  location: 'NY',
  installation_date: '2025-01-01',
  warranty_expiration: '',
  last_maintenance: '',
  notes: '',
  custom_attributes: {},
  image_url: '',
  last_known_location: null as string | null,
  team_id: 'team-1' as any,
};

describe('useEquipmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents submit when permission denied', async () => {
    const perms = await import('@/hooks/usePermissions');
    (perms.usePermissions as any).mockReturnValue({
      canManageEquipment: () => false,
      hasRole: () => false,
    });

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
    const createMock = (useCreateEquipment as any).mock.results[0].value;
    const updateMock = (useUpdateEquipment as any).mock.results[0].value;
    expect(createMock.mutateAsync).not.toHaveBeenCalled();
    expect(updateMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('requires team assignment for non-admin users', async () => {
    const perms = await import('@/hooks/usePermissions');
    (perms.usePermissions as any).mockReturnValue({
      canManageEquipment: () => true,
      hasRole: () => false,
    });

    const client = new QueryClient();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: undefined, onClose: vi.fn() })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues, team_id: 'unassigned' as any });
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Team Assignment Required' })
    );
    const createMock = (useCreateEquipment as any).mock.results[0].value;
    expect(createMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates equipment successfully', async () => {
    const perms = await import('@/hooks/usePermissions');
    (perms.usePermissions as any).mockReturnValue({
      canManageEquipment: () => true,
      hasRole: () => false, // non-admin but team assigned -> allowed
    });

    const client = new QueryClient();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useEquipmentForm({ equipment: undefined, onClose })
    , { wrapper: createWrapper(client) });

    const createMock = (useCreateEquipment as any).mock.results[0].value;

    await act(async () => {
      await result.current.onSubmit({ ...baseValues, team_id: 'team-1' as any });
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
    const equipment = { id: 'eq-1' } as any;

    const { result } = renderHook(() =>
      useEquipmentForm({ equipment, onClose })
    , { wrapper: createWrapper(client) });

    const updateMock = (useUpdateEquipment as any).mock.results[0].value;

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
      useEquipmentForm({ equipment: {} as any, onClose: vi.fn() })
    , { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.onSubmit({ ...baseValues });
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Update Failed' })
    );
  });
});
