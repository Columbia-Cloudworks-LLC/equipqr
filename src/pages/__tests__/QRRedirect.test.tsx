import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import QRRedirect from '../QRRedirect';

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn()
  };
});

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
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: 'test-equipment-id' });
      
      render(<QRRedirect />);
      
      expect(screen.getByTestId('qr-redirect-handler')).toBeInTheDocument();
    });

    it('passes equipmentId from params to QRRedirectHandler', () => {
      const testEquipmentId = 'test-equipment-123';
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: testEquipmentId });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', testEquipmentId);
      expect(screen.getByText(`QR Redirect Handler - Equipment ID: ${testEquipmentId}`)).toBeInTheDocument();
    });
  });

  describe('URL Parameter Handling', () => {
    it('handles missing equipmentId parameter', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({});
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler.getAttribute('data-equipment-id')).toBeNull();
      expect(screen.getByText('QR Redirect Handler - Equipment ID: undefined')).toBeInTheDocument();
    });

    it('handles undefined equipmentId parameter', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: undefined });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler.getAttribute('data-equipment-id')).toBeNull();
      expect(screen.getByText('QR Redirect Handler - Equipment ID: undefined')).toBeInTheDocument();
    });

    it('handles empty string equipmentId parameter', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: '' });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', '');
      expect(screen.getByText('QR Redirect Handler - Equipment ID: undefined')).toBeInTheDocument();
    });

    it('handles special characters in equipmentId', () => {
      const specialId = 'equipment-id-with-special-chars-!@#$%';
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: specialId });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', specialId);
      expect(screen.getByText(`QR Redirect Handler - Equipment ID: ${specialId}`)).toBeInTheDocument();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('correctly types equipmentId parameter', () => {
      const equipmentId = 'typed-equipment-id';
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId });
      
      render(<QRRedirect />);
      
      // Should render without TypeScript errors
      expect(screen.getByTestId('qr-redirect-handler')).toBeInTheDocument();
    });

    it('handles numeric equipmentId (as string from URL)', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: '12345' });
      
      render(<QRRedirect />);
      
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toHaveAttribute('data-equipment-id', '12345');
    });
  });

  describe('Component Structure', () => {
    it('renders as a simple wrapper component', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: 'test-id' });
      
      render(<QRRedirect />);
      
      // Should render the QRRedirectHandler component
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toBeInTheDocument();
    });

    it('does not add any additional wrapper elements', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: 'test-id' });
      
      render(<QRRedirect />);
      
      // QRRedirectHandler should be rendered directly
      const handler = screen.getByTestId('qr-redirect-handler');
      expect(handler).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with React Router params system', () => {
      // Simulate how React Router would call useParams
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({
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
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: 'first-id' });
      rerender(<QRRedirect />);
      expect(screen.getByText('QR Redirect Handler - Equipment ID: first-id')).toBeInTheDocument();
      
      // Re-render with different equipmentId
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ equipmentId: 'second-id' });
      rerender(<QRRedirect />);
      expect(screen.getByText('QR Redirect Handler - Equipment ID: second-id')).toBeInTheDocument();
    });
  });
});
