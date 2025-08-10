// Mock providers file to avoid react-refresh warnings
import React from 'react';

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-auth-provider">{children}</div>
);

export const MockSessionProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-session-provider">{children}</div>
);

export const MockUserProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-user-provider">{children}</div>
);

export const MockSimpleOrganizationProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-organization-provider">{children}</div>
);