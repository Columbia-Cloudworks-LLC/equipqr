
import { useOrganization } from '@/hooks/useOrganization';

export const useCustomersFeature = () => {
  const { currentOrganization } = useOrganization();
  
  return {
    isEnabled: !!currentOrganization?.features?.includes('customers') || false
  };
};
