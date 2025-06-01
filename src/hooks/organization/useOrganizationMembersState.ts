
import { useState } from 'react';
import { UserRole } from '@/types/supabase-enums';

interface Member {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export function useOrganizationMembersState() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  return {
    members,
    setMembers,
    pendingInvitations,
    setPendingInvitations,
    isLoading,
    setIsLoading,
    isInviting,
    setIsInviting
  };
}

export type { Member, PendingInvitation };
