import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateWorkOrder } from '../useWorkOrderUpdate';

// Mock dependencies
vi.mock('@/integrations/supabase/client', async () => {
  const { createMockSupabaseClient } = await import('@/test/utils/mock-supabase');
  return { supabase: createMockSupabaseClient() };
});

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

vi.mock('@/utils/errorHandling', () => ({
  showErrorToast: vi.fn(),
  getErrorMessage: vi.fn((e) => e?.message ?? 'Unknown error')
}));

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-1' } })
}));

// Import mocked modules for assertions
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { showErrorToast, getErrorMessage } from '@/utils/errorHandling';

interface TestComponentProps {
  onReady?: (mutation: any) => void;
}

const TestComponent = ({ onReady }: TestComponentProps) => {
  const mutation = useUpdateWorkOrder();
  
  React.useEffect(() => {
    if (onReady) {
      onReady(mutation);
    }
  }, [mutation, onReady]);

  return (
    <div>
      <div data-testid="is-pending">{mutation.isPending.toString()}</div>
      <div data-testid="is-success">{mutation.isSuccess.toString()}</div>
      <div data-testid="is-error">{mutation.isError.toString()}</div>
    </div>
  );
};

describe('useWorkOrderUpdate', () => {
  let mockQueryClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = {
      invalidateQueries: vi.fn()
    };
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful work order update', async () => {
    const mockUpdatedWorkOrder = {
      id: 'wo-1',
      title: 'Updated Work Order',
      status: 'in_progress'
    };

    // Mock successful update
    const mockChain = vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockUpdatedWorkOrder,
        error: null
      })
    } as any);

    let capturedMutation: any;
    
    render(
      <TestComponent onReady={(mutation) => { capturedMutation = mutation; }} />
    );

    // Wait for mutation to be ready
    await waitFor(() => {
      expect(capturedMutation).toBeDefined();
    });

    // Trigger the mutation
    const updateData = { title: 'Updated Work Order', status: 'in_progress' as const };
    await capturedMutation.mutateAsync({ workOrderId: 'wo-1', data: updateData });

    // Verify Supabase was called correctly
    expect(supabase.from).toHaveBeenCalledWith('work_orders');

    // Verify query invalidation
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['enhanced-work-orders', 'org-1']
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['workOrders', 'org-1']
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['work-orders-filtered-optimized', 'org-1']
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['dashboardStats', 'org-1']
    });

    // Verify success toast
    expect(toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Work order updated successfully'
    });

    // Verify success state
    await waitFor(() => {
      expect(screen.getByTestId('is-success')).toHaveTextContent('true');
    });
  });

  it('should handle permission denied error with specific message', async () => {
    const permissionError = { message: 'permission denied' };
    
    // Mock permission error
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: permissionError
      })
    } as any);

    vi.mocked(getErrorMessage).mockReturnValue('permission denied');

    let capturedMutation: any;
    
    render(
      <TestComponent onReady={(mutation) => { capturedMutation = mutation; }} />
    );

    await waitFor(() => {
      expect(capturedMutation).toBeDefined();
    });

    // Trigger the mutation and expect it to reject
    await expect(
      capturedMutation.mutateAsync({ workOrderId: 'wo-1', data: { title: 'Test' } })
    ).rejects.toThrow();

    // Verify error handling
    expect(getErrorMessage).toHaveBeenCalledWith(permissionError);
    expect(toast).toHaveBeenCalledWith({
      title: 'Update Failed',
      description: 'You don\'t have permission to update this work order. Please contact your organization administrator.',
      variant: 'destructive'
    });
    expect(showErrorToast).toHaveBeenCalledWith(permissionError);

    // Verify error state
    await waitFor(() => {
      expect(screen.getByTestId('is-error')).toHaveTextContent('true');
    });
  });

  it('should handle generic error', async () => {
    const genericError = { message: 'Network error' };
    
    // Mock generic error
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: genericError
      })
    } as any);

    vi.mocked(getErrorMessage).mockReturnValue('Network error');

    let capturedMutation: any;
    
    render(
      <TestComponent onReady={(mutation) => { capturedMutation = mutation; }} />
    );

    await waitFor(() => {
      expect(capturedMutation).toBeDefined();
    });

    // Trigger the mutation and expect it to reject
    await expect(
      capturedMutation.mutateAsync({ workOrderId: 'wo-1', data: { title: 'Test' } })
    ).rejects.toThrow();

    // Verify generic error handling
    expect(toast).toHaveBeenCalledWith({
      title: 'Update Failed',
      description: 'Failed to update work order. Please try again.',
      variant: 'destructive'
    });
    expect(showErrorToast).toHaveBeenCalledWith(genericError);
  });

  it('should show loading state during mutation', async () => {
    let resolveUpdate: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });

    // Mock deferred resolution
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(updatePromise)
    } as any);

    let capturedMutation: any;
    
    render(
      <TestComponent onReady={(mutation) => { capturedMutation = mutation; }} />
    );

    await waitFor(() => {
      expect(capturedMutation).toBeDefined();
    });

    // Trigger mutation without awaiting
    capturedMutation.mutate({ workOrderId: 'wo-1', data: { title: 'Test' } });

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByTestId('is-pending')).toHaveTextContent('true');
    });

    // Resolve the promise
    resolveUpdate!({ data: { id: 'wo-1' }, error: null });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByTestId('is-pending')).toHaveTextContent('false');
      expect(screen.getByTestId('is-success')).toHaveTextContent('true');
    });
  });

  it('should handle component unmount during pending mutation', async () => {
    let resolveUpdate: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });

    // Mock deferred resolution
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(updatePromise)
    } as any);

    let capturedMutation: any;
    
    const { unmount } = render(
      <TestComponent onReady={(mutation) => { capturedMutation = mutation; }} />
    );

    await waitFor(() => {
      expect(capturedMutation).toBeDefined();
    });

    // Trigger mutation
    capturedMutation.mutate({ workOrderId: 'wo-1', data: { title: 'Test' } });

    // Unmount component while mutation is pending
    unmount();

    // Resolve the promise after unmount - should not cause errors
    resolveUpdate!({ data: { id: 'wo-1' }, error: null });

    // Wait a bit to ensure no errors are thrown
    await new Promise(resolve => setTimeout(resolve, 100));
  });
});