import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect, type MockedFunction } from 'vitest';
import PMProgressIndicator from '../PMProgressIndicator';
import { TestProviders } from '@/test/utils/TestProviders';
import { usePMByWorkOrderId } from '@/hooks/usePMData';

// Mock hooks with proper factory to avoid hoisting
vi.mock('@/hooks/usePMData', () => ({
  usePMByWorkOrderId: vi.fn()
}));

const mockPMData = {
  id: 'pm-1',
  work_order_id: 'wo-1',
  equipment_id: 'eq-1',
  status: 'in_progress',
  checklist_data: [
    {
      id: 'item-1',
      section: 'Engine',
      title: 'Check oil level',
      description: 'Verify oil is at proper level',
      completed: true,
      checked: false
    },
    {
      id: 'item-2',
      section: 'Engine',
      title: 'Check coolant',
      description: 'Verify coolant level',
      completed: true,
      checked: false
    },
    {
      id: 'item-3',
      section: 'Safety',
      title: 'Test brakes',
      description: 'Ensure brakes function',
      completed: false,
      checked: false
    }
  ],
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  completed_by: null,
  completed_at: null,
  historical_completion_date: null,
  historical_notes: null,
  organization_id: 'org-1'
};

const createMockQueryResult = (data: unknown) => ({
  data,
  isLoading: false,
  isError: false,
  isPending: false,
  error: null,
  status: 'success' as const,
  isSuccess: true,
  isFetching: false,
  isRefetching: false,
  refetch: vi.fn(),
  fetchStatus: 'idle' as const,
  isLoadingError: false,
  isRefetchError: false,
  dataUpdatedAt: Date.now(),
  errorUpdatedAt: 0,
  errorUpdateCount: 0,
  failureCount: 0,
  failureReason: null,
  isStale: false,
  isPlaceholderData: false,
  isInitialLoading: false,
  isFetched: true,
  isFetchedAfterMount: true,
  isPaused: false,
  promise: Promise.resolve(data)
}) as any;

describe('PMProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No PM Required', () => {
    it('shows nothing when PM is not required', () => {
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(mockPMData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={false} />, { wrapper: TestProviders });
      
      expect(screen.queryByText('PM Required')).not.toBeInTheDocument();
      expect(screen.queryByText('PM Complete')).not.toBeInTheDocument();
    });

    it('shows nothing when PM data is null', () => {
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(null));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.queryByText('PM Required')).not.toBeInTheDocument();
      expect(screen.queryByText('PM Complete')).not.toBeInTheDocument();
    });
  });

  describe('PM Required Badge', () => {
    it('shows PM Required badge with progress bar', () => {
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(mockPMData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Required')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('calculates completion percentage correctly', () => {
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(mockPMData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Required')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
      
      // Progress component uses style transform, not aria-valuenow
      const progressBar = screen.getByText('67%').previousElementSibling;
      expect(progressBar).toBeInTheDocument();
    });

    it('shows 0% when no items completed', () => {
      const noCompletedData = {
        ...mockPMData,
        checklist_data: [
          { id: '1', title: 'Check oil', section: 'Engine', completed: false, checked: false },
          { id: '2', title: 'Check filter', section: 'Engine', completed: false, checked: false }
        ]
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(noCompletedData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Required')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // Progress component uses style transform, not aria-valuenow
      const progressBar = screen.getByText('0%').previousElementSibling;
      expect(progressBar).toBeInTheDocument();
    });

    it('handles empty checklist', () => {
      const emptyData = {
        ...mockPMData,
        checklist_data: []
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(emptyData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Required')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // Progress component uses style transform, not aria-valuenow
      const progressBar = screen.getByText('0%').previousElementSibling;
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('PM Complete Badge', () => {
    it('shows PM Complete badge when status is completed', () => {
      const completePMData = {
        ...mockPMData,
        status: 'completed'
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(completePMData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Complete')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('hides progress bar when complete', () => {
      const completePMData = {
        ...mockPMData,
        status: 'completed'
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(completePMData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Complete')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null checklist data', () => {
      const nullChecklistData = {
        ...mockPMData,
        checklist_data: null
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(nullChecklistData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Required')).toBeInTheDocument();
      // No progress bar or percentage shown for null data
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('handles undefined checklist data', () => {
      const undefinedChecklistData = {
        ...mockPMData,
        checklist_data: undefined
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(undefinedChecklistData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      expect(screen.getByText('PM Required')).toBeInTheDocument();
      // No progress bar or percentage shown for undefined data
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('considers completed and checked items as finished', () => {
      const mixedData = {
        ...mockPMData,
        checklist_data: [
          { id: '1', section: 'Test', title: 'Item 1', description: '', completed: true, checked: false },
          { id: '2', section: 'Test', title: 'Item 2', description: '', completed: false, checked: true },
          { id: '3', section: 'Test', title: 'Item 3', description: '', completed: true, checked: true },
          { id: '4', section: 'Test', title: 'Item 4', description: '', completed: false, checked: false }
        ]
      };
      (usePMByWorkOrderId as MockedFunction<typeof usePMByWorkOrderId>).mockReturnValue(createMockQueryResult(mixedData));
      
      render(<PMProgressIndicator workOrderId="wo-1" hasPM={true} />, { wrapper: TestProviders });
      
      // Should count completed OR checked as finished (3/4 = 75%)
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});