
// Compatibility layer - re-export everything from UnifiedOrganizationContext
export {
  useUnifiedOrganization as useSimpleOrganization,
  UnifiedOrganizationProvider as SimpleOrganizationProvider,
  type UnifiedOrganizationContextType as SimpleOrganizationContextType
} from './UnifiedOrganizationContext';
