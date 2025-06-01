
import { useState } from 'react';

/**
 * State management for team membership functionality
 */
export function useTeamMembershipState() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean>(true); // Start optimistic
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [accessRole, setAccessRole] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const [hasCrossOrgAccess, setHasCrossOrgAccess] = useState<boolean>(false);
  const [teamOrgName, setTeamOrgName] = useState<string | null>(null);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [hasOrgAccess, setHasOrgAccess] = useState<boolean>(false);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [checkAttempts, setCheckAttempts] = useState<number>(0);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);

  return {
    // State values
    currentUserId,
    isMember,
    isCheckingAccess,
    error,
    retryCount,
    accessRole,
    accessReason,
    hasCrossOrgAccess,
    teamOrgName,
    teamDetails,
    hasOrgAccess,
    organizationRole,
    checkAttempts,
    retryTimeout,
    
    // State setters
    setCurrentUserId,
    setIsMember,
    setIsCheckingAccess,
    setError,
    setRetryCount,
    setAccessRole,
    setAccessReason,
    setHasCrossOrgAccess,
    setTeamOrgName,
    setTeamDetails,
    setHasOrgAccess,
    setOrganizationRole,
    setCheckAttempts,
    setRetryTimeout
  };
}
