import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { 
  MockAuthProvider, 
  MockSessionProvider, 
  MockUserProvider, 
  MockSimpleOrganizationProvider 
} from './mock-providers';

// Test providers wrapper
const TestProviders = ({ children }: { children: React.ReactNode }) => {
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
            <MockUserProvider>
              <MockSimpleOrganizationProvider>
                {children}
              </MockSimpleOrganizationProvider>
            </MockUserProvider>
          </MockSessionProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });