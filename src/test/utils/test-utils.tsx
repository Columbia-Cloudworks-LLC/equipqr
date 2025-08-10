import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';
import { SimpleOrganizationProvider } from '@/contexts/SimpleOrganizationContext';

// Simplified mock providers for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

const MockSessionProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <MockSessionProvider>
            <UserProvider>
              <SimpleOrganizationProvider>
                {children}
              </SimpleOrganizationProvider>
            </UserProvider>
          </MockSessionProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };