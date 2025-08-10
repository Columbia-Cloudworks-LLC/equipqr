import { useContext } from 'react';
import { SimpleOrganizationContext } from '@/contexts/SimpleOrganizationContext';

export const useSimpleOrganization = () => {
  const context = useContext(SimpleOrganizationContext);
  if (context === undefined) {
    throw new Error('useSimpleOrganization must be used within a SimpleOrganizationProvider');
  }
  return context;
};