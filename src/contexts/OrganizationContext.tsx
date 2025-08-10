
// Compatibility layer - re-export everything from SimpleOrganizationContext
export {
  SimpleOrganizationProvider as OrganizationProvider,
  type SimpleOrganizationContextType as OrganizationContextType
} from './SimpleOrganizationContext';

export { useSimpleOrganization as useOrganization } from '@/hooks/useSimpleOrganization';
