
import { useState } from 'react';

/**
 * Hook to manage team membership state
 */
export function useTeamMembershipState() {
  // Member status state
  const [isMember, setIsMember] = useState<boolean>(true); // Optimistic initial state
  const [isRepairingTeam, setIsRepairingTeam] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  
  // User info state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Error handling state
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);
  
  // Access details state
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const [accessRole, setAccessRole] = useState<string | null>(null);
  const [hasCrossOrgAccess, setHasCrossOrgAccess] = useState<boolean>(false);
  const [teamOrgName, setTeamOrgName] = useState<string | null>(null);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [hasOrgAccess, setHasOrgAccess] = useState<boolean>(false);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  
  return {
    // Member status
    isMember,
    setIsMember,
    isRepairingTeam,
    setIsRepairingTeam,
    isCheckingAccess,
    setIsCheckingAccess,
    
    // User info
    currentUserId,
    setCurrentUserId,
    
    // Error handling
    error,
    setError,
    retryCount,
    setRetryCount,
    checkAttempts,
    setCheckAttempts,
    retryTimeout,
    setRetryTimeout,
    
    // Access details
    accessReason,
    setAccessReason,
    accessRole,
    setAccessRole,
    hasCrossOrgAccess,
    setHasCrossOrgAccess,
    teamOrgName,
    setTeamOrgName,
    teamDetails,
    setTeamDetails,
    hasOrgAccess,
    setHasOrgAccess,
    organizationRole,
    setOrganizationRole,
  };
}
