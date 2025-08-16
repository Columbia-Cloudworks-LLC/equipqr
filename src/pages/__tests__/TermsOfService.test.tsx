import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import TermsOfService from '../TermsOfService';

// Mock Link from react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  )
}));

describe('TermsOfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('renders the page without crashing', () => {
      render(<TermsOfService />);
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    });

    it('displays the main heading', () => {
      render(<TermsOfService />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Terms of Service');
    });

    it('shows last updated date', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      // Should show current date
      const currentDate = new Date().toLocaleDateString();
      expect(screen.getByText(currentDate)).toBeInTheDocument();
    });

    it('includes back to dashboard link', () => {
      render(<TermsOfService />);
      
      const backLink = screen.getByRole('link', { name: /back to dashboard/i });
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Terms Sections', () => {
    it('displays acceptance of terms section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Acceptance of Terms')).toBeInTheDocument();
      expect(screen.getByText(/By accessing and using EquipQR/)).toBeInTheDocument();
    });

    it('displays description of service section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Description of Service')).toBeInTheDocument();
      expect(screen.getByText(/EquipQR is a fleet equipment management platform/)).toBeInTheDocument();
    });

    it('displays user accounts section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('User Accounts')).toBeInTheDocument();
      expect(screen.getByText(/To access certain features of the Service/)).toBeInTheDocument();
    });

    it('displays acceptable use section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Acceptable Use')).toBeInTheDocument();
      expect(screen.getByText(/You agree to use the Service only for lawful purposes/)).toBeInTheDocument();
    });

    it('displays payment and subscription section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Payment and Subscription')).toBeInTheDocument();
      expect(screen.getByText(/Certain features of the Service may require payment/)).toBeInTheDocument();
    });

    it('displays termination section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Termination')).toBeInTheDocument();
      expect(screen.getByText(/We may terminate or suspend your access/)).toBeInTheDocument();
    });

    it('displays disclaimer of warranties section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Disclaimer of Warranties')).toBeInTheDocument();
      expect(screen.getByText(/THE SERVICE IS PROVIDED ON AN "AS IS"/)).toBeInTheDocument();
    });

    it('displays limitation of liability section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
      expect(screen.getByText(/TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW/)).toBeInTheDocument();
    });

    it('displays governing law section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Governing Law')).toBeInTheDocument();
      expect(screen.getByText(/These Terms of Service shall be governed by and construed/)).toBeInTheDocument();
    });

    it('displays intellectual property rights section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Intellectual Property Rights')).toBeInTheDocument();
      expect(screen.getByText(/The Service and its original content/)).toBeInTheDocument();
    });

    it('displays changes to terms section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Changes to Terms')).toBeInTheDocument();
      expect(screen.getByText(/We reserve the right to modify or revise/)).toBeInTheDocument();
    });

    it('displays entire agreement section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Entire Agreement')).toBeInTheDocument();
      expect(screen.getByText(/These Terms of Service constitute the entire agreement/)).toBeInTheDocument();
    });

    it('displays contact information section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText(/If you have any questions about these Terms of Service/)).toBeInTheDocument();
    });
  });

  describe('External Links', () => {
    it('includes Columbia CloudWorks links with correct attributes', () => {
      render(<TermsOfService />);
      
      const cloudWorksLinks = screen.getAllByText('COLUMBIA CLOUDWORKS LLC');
      
      cloudWorksLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', 'https://columbiacloudworks.com');
        expect(link.closest('a')).toHaveAttribute('target', '_blank');
        expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('includes correct contact email', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('nicholas.king@columbiacloudworks.com')).toBeInTheDocument();
    });

    it('includes correct website URL', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText('https://equipqr.app')).toBeInTheDocument();
    });
  });

  describe('Legal Content', () => {
    it('includes proper list formatting in acceptable use section', () => {
      render(<TermsOfService />);
      
      expect(screen.getByText(/Use the Service in any way that violates any applicable laws/)).toBeInTheDocument();
      expect(screen.getByText(/Engage in any conduct that could damage, disable/)).toBeInTheDocument();
      expect(screen.getByText(/Attempt to gain unauthorized access/)).toBeInTheDocument();
      expect(screen.getByText(/Use the Service to transmit any viruses/)).toBeInTheDocument();
      expect(screen.getByText(/Collect or harvest any information about other users/)).toBeInTheDocument();
    });

    it('displays all caps legal text correctly', () => {
      render(<TermsOfService />);
      
      // Should display legal disclaimers in all caps as intended
      expect(screen.getByText(/THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS/)).toBeInTheDocument();
      expect(screen.getByText(/TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE BE LIABLE/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('uses proper container classes for responsive layout', () => {
      const { container } = render(<TermsOfService />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('container', 'mx-auto', 'px-4', 'py-8', 'max-w-4xl');
    });

    it('applies proper spacing between sections', () => {
      render(<TermsOfService />);
      
      // Look for the space-y-8 class that provides consistent spacing
      const sectionsContainer = screen.getByText('Acceptance of Terms').closest('div')?.parentElement;
      expect(sectionsContainer).toHaveClass('space-y-8');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<TermsOfService />);
      
      // Main heading should be h1
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Terms of Service');
      
      // Section headings should be properly structured
      const sectionHeadings = screen.getAllByRole('heading');
      expect(sectionHeadings.length).toBeGreaterThan(1);
    });

    it('includes aria-labels and proper link text', () => {
      render(<TermsOfService />);
      
      const backLink = screen.getByRole('link', { name: /back to dashboard/i });
      expect(backLink).toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    it('renders content in card components', () => {
      render(<TermsOfService />);
      
      // Each section should be in a card format - check for multiple cards
      const acceptanceSection = screen.getByText('Acceptance of Terms').closest('div');
      expect(acceptanceSection).toBeInTheDocument();
      
      const descriptionSection = screen.getByText('Description of Service').closest('div');
      expect(descriptionSection).toBeInTheDocument();
    });
  });
});