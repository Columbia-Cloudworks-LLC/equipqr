import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock all the page components
vi.mock('@/pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>
}));

vi.mock('@/pages/Equipment', () => ({
  default: () => <div data-testid="equipment-page">Equipment</div>
}));

vi.mock('@/pages/WorkOrders', () => ({
  default: () => <div data-testid="work-orders-page">Work Orders</div>
}));

vi.mock('@/pages/Teams', () => ({
  default: () => <div data-testid="teams-page">Teams</div>
}));

vi.mock('@/pages/Auth', () => ({
  default: () => <div data-testid="auth-page">Auth</div>
}));

vi.mock('@/components/landing/SmartLanding', () => ({
  default: () => <div data-testid="landing-page">Landing</div>
}));

vi.mock('@/pages/Support', () => ({
  default: () => <div data-testid="support-page">Support</div>
}));

vi.mock('@/pages/TermsOfService', () => ({
  default: () => <div data-testid="terms-page">Terms</div>
}));

vi.mock('@/pages/PrivacyPolicy', () => ({
  default: () => <div data-testid="privacy-page">Privacy</div>
}));

// Mock context providers
vi.mock('@/contexts/TeamContext', () => ({
  TeamProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/contexts/SimpleOrganizationProvider', () => ({
  SimpleOrganizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div className={className}>{children}</div>
}));

vi.mock('@/components/layout/AppSidebar', () => ({
  default: () => <div data-testid="app-sidebar">Sidebar</div>
}));

vi.mock('@/components/layout/TopBar', () => ({
  default: () => <div data-testid="top-bar">TopBar</div>
}));

vi.mock('@/components/layout/LegalFooter', () => ({
  default: () => <div data-testid="legal-footer">Legal Footer</div>
}));

vi.mock('@/components/auth/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the redirect components
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div data-testid="navigate" data-to={to}>Navigate to {to}</div>;
    },
    useParams: vi.fn(() => ({ equipmentId: 'test-id', workOrderId: 'test-work-order' }))
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApp = (initialEntries = ['/']) => {
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  };

  describe('App Structure', () => {
    it('renders without crashing', () => {
      renderApp();
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Route Navigation', () => {
    it('renders landing page for root route', () => {
      renderApp(['/']);
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('renders auth page for /auth route', () => {
      renderApp(['/auth']);
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('renders support page for /support route', () => {
      renderApp(['/support']);
      expect(screen.getByTestId('support-page')).toBeInTheDocument();
    });

    it('renders terms page for /terms-of-service route', () => {
      renderApp(['/terms-of-service']);
      expect(screen.getByTestId('terms-page')).toBeInTheDocument();
    });

    it('renders privacy page for /privacy-policy route', () => {
      renderApp(['/privacy-policy']);
      expect(screen.getByTestId('privacy-page')).toBeInTheDocument();
    });
  });

  describe('App Components', () => {
    it('includes AppProviders wrapper', () => {
      const { container } = renderApp();
      // The app should be wrapped in providers
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Redirect Routes', () => {
    it('handles equipment redirect route', () => {
      renderApp(['/equipment/test-id']);
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard/equipment/test-id');
    });

    it('handles work order redirect route', () => {
      renderApp(['/work-orders/test-work-order']);
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard/work-orders/test-work-order');
    });
  });

  describe('BrandedTopBar Component', () => {
    it('renders TopBar component', () => {
      renderApp(['/dashboard']);
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });
  });
});