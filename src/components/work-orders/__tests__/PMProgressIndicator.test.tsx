import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import PMProgressIndicator from '../PMProgressIndicator';
import { TestProviders } from '@/test/utils/TestProviders';

// Mock hooks
const mockUsePMByWorkOrderId = vi.fn();
vi.mock('@/hooks/usePMData', () => ({
  usePMByWorkOrderId: mockUsePMByWorkOrderId,
}));

const mockPMData = {
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
  ]
};

describe('PMProgressIndicator', () => {
  const defaultProps = {
    workOrderId: 'wo-1',
    hasPM: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No PM Required', () => {
    it('shows nothing when PM is not required', () => {
      const { container } = render(
        <TestProviders>
          <PMProgressIndicator {...{ ...defaultProps, hasPM: false }} />
        </TestProviders>
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows nothing when PM data is null', () => {
      mockUsePMByWorkOrderId.mockReturnValue({
        data: null,
        isLoading: false
      });

      const { container } = render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('PM Required Badge', () => {
    it('shows PM Required badge with progress bar', () => {
      mockUsePMByWorkOrderId.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('PM Required')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('calculates completion percentage correctly', () => {
      mockUsePMByWorkOrderId.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      // 2 out of 3 items completed = 67%
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '67');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('shows 0% when no items completed', () => {
      const incompletePMData = {
        status: 'in_progress',
        checklist_data: [
          {
            id: 'item-1',
            section: 'Engine',
            title: 'Check oil',
            description: 'Check oil level',
            completed: false,
            checked: false
          },
          {
            id: 'item-2',
            section: 'Safety',
            title: 'Test brakes',
            description: 'Test brake function',
            completed: false,
            checked: false
          }
        ]
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: incompletePMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles empty checklist', () => {
      const emptyPMData = {
        status: 'in_progress',
        checklist_data: []
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: emptyPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('PM Complete Badge', () => {
    it('shows PM Complete badge when all items finished', () => {
      const completePMData = {
        status: 'completed',
        checklist_data: [
          {
            id: 'item-1',
            section: 'Engine',
            title: 'Check oil',
            description: 'Check oil level',
            completed: true,
            checked: false
          },
          {
            id: 'item-2',
            section: 'Safety',
            title: 'Test brakes',
            description: 'Test brake function',
            completed: true,
            checked: false
          }
        ]
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: completePMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('PM Complete')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('shows complete state when status is completed', () => {
      const completePMData = {
        status: 'completed',
        checklist_data: [
          {
            id: 'item-1',
            section: 'Engine',
            title: 'Check oil',
            description: 'Check oil level',
            completed: true,
            checked: false
          }
        ]
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: completePMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('PM Complete')).toBeInTheDocument();
      // Should not show progress bar when complete
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null checklist data', () => {
      const nullChecklistData = {
        status: 'in_progress',
        checklist_data: null
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: nullChecklistData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles undefined checklist data', () => {
      const undefinedChecklistData = {
        status: 'in_progress',
        checklist_data: undefined
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: undefinedChecklistData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('considers completed and checked items as finished', () => {
      const mixedData = {
        status: 'in_progress',
        checklist_data: [
          { id: '1', section: 'Test', title: 'Item 1', description: '', completed: true, checked: false },
          { id: '2', section: 'Test', title: 'Item 2', description: '', completed: false, checked: true },
          { id: '3', section: 'Test', title: 'Item 3', description: '', completed: true, checked: true },
          { id: '4', section: 'Test', title: 'Item 4', description: '', completed: false, checked: false }
        ]
      };

      mockUsePMByWorkOrderId.mockReturnValue({
        data: mixedData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      // Should count completed OR checked as finished (3/4 = 75%)
      expect(screen.getByText('75%')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Progress Bar Styling', () => {
    it('applies correct progress bar width', () => {
      mockUsePMByWorkOrderId.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '67');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes for progress bar', () => {
      mockUsePMByWorkOrderId.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '67');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('provides descriptive text for screen readers', () => {
      mockUsePMByWorkOrderId.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('67%')).toBeInTheDocument();
    });
  });
});