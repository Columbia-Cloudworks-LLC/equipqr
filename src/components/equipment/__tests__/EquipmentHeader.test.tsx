import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils/test-utils';
import EquipmentHeader from '../EquipmentHeader';

// Mock the useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn()
}));

const mockUseIsMobile = await import('@/hooks/use-mobile');

describe('EquipmentHeader', () => {
  const defaultProps = {
    organizationName: 'Test Organization',
    canCreate: true,
    onAddEquipment: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mockUseIsMobile.useIsMobile as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('renders the equipment title', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('displays organization name in description', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      expect(screen.getByText('Manage equipment for Test Organization')).toBeInTheDocument();
    });

    it('renders with different organization name', () => {
      render(<EquipmentHeader {...defaultProps} organizationName="Different Org" />);
      
      expect(screen.getByText('Manage equipment for Different Org')).toBeInTheDocument();
    });
  });

  describe('Add Equipment Button', () => {
    it('renders add equipment button when canCreate is true', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: /add equipment/i });
      expect(addButton).toBeInTheDocument();
    });

    it('does not render add equipment button when canCreate is false', () => {
      render(<EquipmentHeader {...defaultProps} canCreate={false} />);
      
      expect(screen.queryByRole('button', { name: /add equipment/i })).not.toBeInTheDocument();
    });

    it('calls onAddEquipment when button is clicked', () => {
      const onAddEquipment = vi.fn();
      render(<EquipmentHeader {...defaultProps} onAddEquipment={onAddEquipment} />);
      
      const addButton = screen.getByRole('button', { name: /add equipment/i });
      fireEvent.click(addButton);
      
      expect(onAddEquipment).toHaveBeenCalledOnce();
    });

    it('includes plus icon in add button', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: /add equipment/i });
      expect(addButton).toBeInTheDocument();
      // The Plus icon should be part of the button content
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      (mockUseIsMobile.useIsMobile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    });

    it('applies mobile-specific classes when on mobile', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1, name: 'Equipment' });
      const container = heading.parentElement?.parentElement;
      expect(container).toHaveClass('space-y-4');
    });

    it('makes add button full width on mobile', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: /add equipment/i });
      expect(addButton).toHaveClass('w-full');
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      (mockUseIsMobile.useIsMobile as ReturnType<typeof vi.fn>).mockReturnValue(false);
    });

    it('applies desktop layout classes when not on mobile', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const container = screen.getByText('Equipment').closest('div')?.parentElement;
      expect(container).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('does not make add button full width on desktop', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: /add equipment/i });
      expect(addButton).not.toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Equipment');
    });

    it('button has accessible name', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: /add equipment/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays the correct heading text', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const heading = screen.getByText('Equipment');
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'tracking-tight');
    });

    it('displays the description with muted styling', () => {
      render(<EquipmentHeader {...defaultProps} />);
      
      const description = screen.getByText('Manage equipment for Test Organization');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('Props Validation', () => {
    it('handles empty organization name', () => {
      render(<EquipmentHeader {...defaultProps} organizationName="" />);
      
      expect(screen.getByText(/^Manage equipment for\s*$/)).toBeInTheDocument();
    });

    it('handles long organization name', () => {
      const longName = 'Very Long Organization Name That Might Wrap';
      render(<EquipmentHeader {...defaultProps} organizationName={longName} />);
      
      expect(screen.getByText(`Manage equipment for ${longName}`)).toBeInTheDocument();
    });
  });
});