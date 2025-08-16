import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import QRRedirect from '../QRRedirect';

// Mock useParams
vi.mock('react-router-dom', () => ({
  useParams: vi.fn()
}));

// Mock QRRedirectHandler component
vi.mock('@/components/qr/QRRedirectHandler', () => ({
  QRRedirectHandler: ({ equipmentId }: { equipmentId?: string }) => (
    <div data-testid="qr-redirect-handler" data-equipment-id={equipmentId}>
      QR Redirect Handler - Equipment ID: {equipmentId || 'undefined'}
    </div>
  )
}));

const { useParams } = await import('react-router-dom');

describe('QRRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders QRRedirectHandler component', () => {
      (useParams as any).mockReturnValue({ equipmentId: 'test-equipment-id' });
      
      render(<QRRedirect />);
      
      expect(screen.getByTestId('qr-redirect-handler')).toBeInTheDocument();
    });

    it('passes equipmentId from params to QRRedirectHandler', () => {
      const testEquipmentId = 'test-equipment-123';
      (useParams as any).mockReturnValue({ equipmentId: testEquipmentId });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', testEquipmentId);
      expect(screen.getByText(`QR Redirect Handler - Equipment ID: ${testEquipmentId}`)).toBeInTheDocument();
    });
  });

  describe('URL Parameter Handling', () => {
    it('handles missing equipmentId parameter', () => {
      (useParams as any).mockReturnValue({});
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', '');
      expect(screen.getByText('QR Redirect Handler - Equipment ID: undefined')).toBeInTheDocument();
    });

    it('handles undefined equipmentId parameter', () => {
      (useParams as any).mockReturnValue({ equipmentId: undefined });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', '');
      expect(screen.getByText('QR Redirect Handler - Equipment ID: undefined')).toBeInTheDocument();
    });

    it('handles empty string equipmentId parameter', () => {
      (useParams as any).mockReturnValue({ equipmentId: '' });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', '');
      expect(screen.getByText('QR Redirect Handler - Equipment ID: ')).toBeInTheDocument();
    });

    it('handles special characters in equipmentId', () => {
      const specialId = 'equipment-id-with-special-chars-!@#$%';
      (useParams as any).mockReturnValue({ equipmentId: specialId });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', specialId);
      expect(screen.getByText(`QR Redirect Handler - Equipment ID: ${specialId}`)).toBeInTheDocument();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('correctly types equipmentId parameter', () => {
      const equipmentId = 'typed-equipment-id';
      (useParams as any).mockReturnValue({ equipmentId });
      
      render(<QRRedirect />);
      
      // Should render without TypeScript errors
      expect(screen.getByTestId('qr-redirect-handler')).toBeInTheDocument();
    });

    it('handles numeric equipmentId (as string from URL)', () => {
      (useParams as any).mockReturnValue({ equipmentId: '12345' });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', '12345');
    });
  });

  describe('Component Structure', () => {
    it('renders as a simple wrapper component', () => {
      (useParams as any).mockReturnValue({ equipmentId: 'test-id' });
      
      const { container } = render(<QRRedirect />);
      
      // Should have minimal structure - just the QRRedirectHandler
      expect(container.children).toHaveLength(1);
      expect(container.firstChild).toHaveAttribute('data-testid', 'qr-redirect-handler');
    });

    it('does not add any additional wrapper elements', () => {
      (useParams as any).mockReturnValue({ equipmentId: 'test-id' });
      
      const { container } = render(<QRRedirect />);
      
      // Direct child should be the QRRedirectHandler mock
      expect(container.firstChild).toHaveAttribute('data-testid', 'qr-redirect-handler');
    });
  });

  describe('Integration', () => {
    it('works with React Router params system', () => {
      // Simulate how React Router would call useParams
      (useParams as any).mockReturnValue({ 
        equipmentId: 'integration-test-id',
        // Other potential params that might be present
        someOtherParam: 'other-value'
      });
      
      render(<QRRedirect />);
      
      // Should only extract and use the equipmentId
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', 'integration-test-id');
    });

    it('re-renders when params change', () => {
      const { rerender } = render(<QRRedirect />);
      
      // Initial render with first equipmentId
      (useParams as any).mockReturnValue({ equipmentId: 'first-id' });
      rerender(<QRRedirect />);
      expect(screen.getByText('QR Redirect Handler - Equipment ID: first-id')).toBeInTheDocument();
      
      // Re-render with different equipmentId
      (useParams as any).mockReturnValue({ equipmentId: 'second-id' });
      rerender(<QRRedirect />);
      expect(screen.getByText('QR Redirect Handler - Equipment ID: second-id')).toBeInTheDocument();
    });
  });
});
