
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddMemberForm } from './AddMemberForm';
import { UserPlus } from "lucide-react";
import { UserRole } from '@/types/supabase-enums';

interface OrganizationMember {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
}

interface AddMemberButtonProps {
  organizationMembers: OrganizationMember[];
  existingTeamMemberIds: string[];
  onAddMember: (userId: string, role: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function AddMemberButton({ 
  organizationMembers,
  existingTeamMemberIds,
  onAddMember,
  isLoading = false,
  disabled = false
}: AddMemberButtonProps) {
  const [open, setOpen] = useState(false);
  
  const handleAddMember = async (userId: string, role: string) => {
    await onAddMember(userId, role);
    setOpen(false);
  };

  // Filter to only show viewer org members who aren't already in team
  const availableMembers = organizationMembers.filter(member => 
    member.role === 'viewer' && !existingTeamMemberIds.includes(member.id)
  );
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="flex items-center gap-2"
          disabled={disabled || availableMembers.length === 0}
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Organization Member to Team</DialogTitle>
        </DialogHeader>
        <AddMemberForm 
          organizationMembers={availableMembers}
          existingTeamMemberIds={existingTeamMemberIds}
          onAddMember={handleAddMember}
          isLoading={isLoading}
          disabled={disabled}
        />
      </DialogContent>
    </Dialog>
  );
}
