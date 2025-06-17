
import { useState } from 'react';

export interface SecurityTestResult {
  canFetchOrganizations: boolean;
  canFetchMembers: boolean;
  canFetchTeams: boolean;
  hasErrors: boolean;
  errors: string[];
}

// DEPRECATED: This hook has been replaced by SessionContext for better performance
// Security testing is now handled internally by the session management system
export const useOrganizationSecurity = () => {
  console.warn('useOrganizationSecurity is deprecated. Use SessionContext instead.');
  
  const [testResult] = useState<SecurityTestResult>({
    canFetchOrganizations: true,
    canFetchMembers: true,
    canFetchTeams: true,
    hasErrors: false,
    errors: []
  });

  return {
    testResult,
    isTestingComplete: true,
    runSecurityTest: () => {}
  };
};
