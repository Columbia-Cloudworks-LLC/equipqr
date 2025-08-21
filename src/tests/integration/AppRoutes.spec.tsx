import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';

// Mock all page components
vi.mock('@/pages/Dashboard', () => ({ default: () => <div data-testid="dashboard-page">Dashboard</div> }));
vi.mock('@/pages/Equipment', () => ({ default: () => <div data-testid="equipment-page">Equipment</div> }));
vi.mock('@/pages/EquipmentDetails', () => ({ default: () => <div data-testid="equipment-details-page">Equipment Details</div> }));
vi.mock('@/pages/WorkOrders', () => ({ default: () => <div data-testid="work-orders-page">Work Orders</div> }));
vi.mock('@/pages/WorkOrderDetails', () => ({ default: () => <div data-testid="work-order-details-page">Work Order Details</div> }));
vi.mock('@/pages/Teams', () => ({ default: () => <div data-testid="teams-page">Teams</div> }));
vi.mock('@/pages/FleetMap', () => ({ default: () => <div data-testid="fleet-map-page">Fleet Map</div> }));
vi.mock('@/pages/Organization', () => ({ default: () => <div data-testid="organization-page">Organization</div> }));
vi.mock('@/pages/Scanner', () => ({ default: () => <div data-testid="scanner-page">Scanner</div> }));
vi.mock('@/pages/Billing', () => ({ default: () => <div data-testid="billing-page">Billing</div> }));
vi.mock('@/pages/Settings', () => ({ default: () => <div data-testid="settings-page">Settings</div> }));
vi.mock('@/pages/Support', () => ({ default: () => <div data-testid="support-page">Support</div> }));
vi.mock('@/pages/landing/Landing', () => ({ default: () => <div data-testid="landing-page">Landing</div> }));
vi.mock('@/pages/auth/Auth', () => ({ default: () => <div data-testid="auth-page">Auth</div> }));
vi.mock('@/pages/terms/Terms', () => ({ default: () => <div data-testid="terms-page">Terms</div> }));
vi.mock('@/pages/privacy/Privacy', () => ({ default: () => <div data-testid="privacy-page">Privacy</div> }));

// Mock contexts
vi.mock('@/contexts/TeamContext', () => ({
  TeamProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="team-provider">{children}</div>
}));

vi.mock('@/providers/SimpleOrganizationProvider', () => ({
  SimpleOrganizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="simple-organization-provider">{children}</div>
  )
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  )
}));

// Mock components
vi.mock('@/components/layout/TopBar', () => ({
  default: () => <div data-testid="top-bar">TopBar</div>
}));

vi.mock('@/components/providers/AppProviders', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  )
}));

// Mock react-router-dom components
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid={`navigate-to-${to.replace('/', '')}`}>Navigating to {to}</div>,
    useParams: () => ({ id: 'test-id' }),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApp = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    );
  };

  it('renders without crashing', () => {
    renderApp();
    expect(screen.getByTestId('app-providers')).toBeInTheDocument();
  });

  it('renders landing page for root path', () => {
    renderApp(['/']);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders auth page for /auth path', () => {
    renderApp(['/auth']);
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  it('renders support page for /support path', () => {
    renderApp(['/support']);
    expect(screen.getByTestId('support-page')).toBeInTheDocument();
  });

  it('renders terms page for /terms path', () => {
    renderApp(['/terms']);
    expect(screen.getByTestId('terms-page')).toBeInTheDocument();
  });

  it('renders privacy page for /privacy path', () => {
    renderApp(['/privacy']);
    expect(screen.getByTestId('privacy-page')).toBeInTheDocument();
  });

  it('contains app providers', () => {
    renderApp();
    expect(screen.getByTestId('app-providers')).toBeInTheDocument();
  });

  it('redirects equipment to equipment list', () => {
    renderApp(['/equipment']);
    expect(screen.getByTestId('navigate-to-equipment')).toBeInTheDocument();
  });

  it('redirects work-orders to work-orders list', () => {
    renderApp(['/work-orders']);
    expect(screen.getByTestId('navigate-to-work-orders')).toBeInTheDocument();
  });

  it('renders TopBar component on dashboard route', () => {
    renderApp(['/dashboard']);
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
  });
});