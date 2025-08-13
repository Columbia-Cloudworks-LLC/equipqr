import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import PMProgressIndicator from '../PMProgressIndicator';
import { TestProviders } from '@/test/utils/TestProviders';

// Mock hooks
const mockUsePMData = vi.fn();
vi.mock('@/hooks/usePMData', () => ({
  usePMData: mockUsePMData,
}));

const mockPMData = {
  requires_pm: true,
  pm_checklist: [
    {
      id: 'item-1',
      section: 'Engine',
      title: 'Check oil level',
      description: 'Verify oil is at proper level',
      condition: 'good',
      notes: 'Oil level is good'
    },
    {
      id: 'item-2',
      section: 'Engine',
      title: 'Check coolant',
      description: 'Verify coolant level',
      condition: 'fair',
      notes: 'Coolant slightly low'
    },
    {
      id: 'item-3',
      section: 'Safety',
      title: 'Test brakes',
      description: 'Ensure brakes function',
      condition: null,
      notes: ''
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
      mockUsePMData.mockReturnValue({
        data: { requires_pm: false },
        isLoading: false
      });

      const { container } = render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows nothing when PM data is null', () => {
      mockUsePMData.mockReturnValue({
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
      mockUsePMData.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('PM Required')).toBeInTheDocument();
      expect(screen.getByText('2/3 Complete')).toBeInTheDocument();
    });

    it('calculates completion percentage correctly', () => {
      mockUsePMData.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      // 2 out of 3 items completed = 66.67%
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '67');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('shows 0% when no items completed', () => {
      const incompletePMData = {
        requires_pm: true,
        pm_checklist: [
          {
            id: 'item-1',
            section: 'Engine',
            title: 'Check oil',
            description: 'Check oil level',
            condition: null,
            notes: ''
          },
          {
            id: 'item-2',
            section: 'Safety',
            title: 'Test brakes',
            description: 'Test brake function',
            condition: null,
            notes: ''
          }
        ]
      };

      mockUsePMData.mockReturnValue({
        data: incompletePMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0/2 Complete')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles empty checklist', () => {
      const emptyPMData = {
        requires_pm: true,
        pm_checklist: []
      };

      mockUsePMData.mockReturnValue({
        data: emptyPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0/0 Complete')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('PM Complete Badge', () => {
    it('shows PM Complete badge when all items finished', () => {
      const completePMData = {
        requires_pm: true,
        pm_checklist: [
          {
            id: 'item-1',
            section: 'Engine',
            title: 'Check oil',
            description: 'Check oil level',
            condition: 'good',
            notes: 'All good'
          },
          {
            id: 'item-2',
            section: 'Safety',
            title: 'Test brakes',
            description: 'Test brake function',
            condition: 'excellent',
            notes: 'Working perfectly'
          }
        ]
      };

      mockUsePMData.mockReturnValue({
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

    it('shows complete state with 100% progress', () => {
      const completePMData = {
        requires_pm: true,
        pm_checklist: [
          {
            id: 'item-1',
            section: 'Engine',
            title: 'Check oil',
            description: 'Check oil level',
            condition: 'good',
            notes: 'Completed'
          }
        ]
      };

      mockUsePMData.mockReturnValue({
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

  describe('Loading State', () => {
    it('shows loading state when PM data is loading', () => {
      mockUsePMData.mockReturnValue({
        data: null,
        isLoading: true
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Loading PM status...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null checklist data', () => {
      const nullChecklistData = {
        requires_pm: true,
        pm_checklist: null
      };

      mockUsePMData.mockReturnValue({
        data: nullChecklistData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0/0 Complete')).toBeInTheDocument();
    });

    it('handles undefined checklist data', () => {
      const undefinedChecklistData = {
        requires_pm: true,
        pm_checklist: undefined
      };

      mockUsePMData.mockReturnValue({
        data: undefinedChecklistData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0/0 Complete')).toBeInTheDocument();
    });

    it('considers various condition values as completed', () => {
      const mixedConditionData = {
        requires_pm: true,
        pm_checklist: [
          { id: '1', section: 'Test', title: 'Item 1', description: '', condition: 'good', notes: '' },
          { id: '2', section: 'Test', title: 'Item 2', description: '', condition: 'fair', notes: '' },
          { id: '3', section: 'Test', title: 'Item 3', description: '', condition: 'poor', notes: '' },
          { id: '4', section: 'Test', title: 'Item 4', description: '', condition: 'excellent', notes: '' },
          { id: '5', section: 'Test', title: 'Item 5', description: '', condition: '', notes: '' },
          { id: '6', section: 'Test', title: 'Item 6', description: '', condition: null, notes: '' }
        ]
      };

      mockUsePMData.mockReturnValue({
        data: mixedConditionData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      // Should count good, fair, poor, excellent as completed (4/6)
      expect(screen.getByText('4/6 Complete')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '67');
    });
  });

  describe('Progress Bar Styling', () => {
    it('applies correct progress bar width', () => {
      mockUsePMData.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      const progressBar = screen.getByRole('progressbar');
      // Should have style attribute with width
      expect(progressBar).toHaveStyle('transform: translateX(-33%)');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes for progress bar', () => {
      mockUsePMData.mockReturnValue({
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
      mockUsePMData.mockReturnValue({
        data: mockPMData,
        isLoading: false
      });

      render(
        <TestProviders>
          <PMProgressIndicator {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('2/3 Complete')).toBeInTheDocument();
    });
  });
});