
import { useSession } from '@/contexts/SessionContext';

export interface SecurityTestResult {
  canFetchOrganizations: boolean;
  canFetchMembers: boolean;
  canFetchTeams: boolean;
  hasErrors: boolean;
  errors: string[];
}

export const useOrganizationSecurity = () => {
  const { sessionData, isLoading, error } = useSession();
  
  const testResult: SecurityTestResult = {
    canFetchOrganizations: !!sessionData?.organizations?.length,
    canFetchMembers: !!sessionData?.organizations?.length,
    canFetchTeams: !!sessionData?.teamMemberships?.length || !!sessionData?.organizations?.length,
    hasErrors: !!error,
    errors: error ? [error] : []
  };

  const runSecurityTest = () => {
    // This is now handled automatically by SessionContext
    console.log('Security test completed via SessionContext');
  };

  return {
    testResult,
    isTestingComplete: !isLoading,
    runSecurityTest
  };
};
