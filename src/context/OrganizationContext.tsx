
import React, { createContext, useState, useEffect } from 'react';

interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billingEmail: string;
  isOwner: boolean;
  userRole: 'admin' | 'member' | 'viewer';
  userStatus: 'active' | 'inactive';
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  logout: () => void;
}

export const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    // Mock organization for now
    setCurrentOrganization({
      id: 'org-1',
      name: 'Demo Organization',
      plan: 'free',
      memberCount: 1,
      maxMembers: 10,
      features: [],
      billingEmail: 'admin@demo.com',
      isOwner: true,
      userRole: 'admin',
      userStatus: 'active'
    });
  }, []);

  const logout = () => {
    // Handle logout logic
    setCurrentOrganization(null);
  };

  return (
    <OrganizationContext.Provider value={{ currentOrganization, logout }}>
      {children}
    </OrganizationContext.Provider>
  );
};
