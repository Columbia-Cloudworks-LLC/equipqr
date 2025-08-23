
import React, { createContext, useMemo, useState } from 'react';

export interface Organization {
  id: string;
  name: string;
  plan?: string | null;
}

interface OrganizationContextValue {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
}

export const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Minimal in-memory state; real app may load this from Supabase/user profile
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  const value = useMemo(
    () => ({ currentOrganization, setCurrentOrganization }),
    [currentOrganization]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
