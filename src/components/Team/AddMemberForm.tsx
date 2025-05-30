
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Users } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationMember {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
}

interface AddMemberFormProps {
  organizationMembers: OrganizationMember[];
  existingTeamMemberIds: string[];
  onAddMember: (userId: string, role: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export function AddMemberForm({ 
  organizationMembers, 
  existingTeamMemberIds,
  onAddMember, 
  isLoading, 
  disabled = false 
}: AddMemberFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [role, setRole] = useState<string>('viewer');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter out members who are already in the team and non-viewer org roles
  const availableMembers = organizationMembers.filter(member => 
    !existingTeamMemberIds.includes(member.id) && member.role === 'viewer'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setValidationError('Please select a member to add');
      return;
    }

    setValidationError(null);

    try {
      await onAddMember(selectedUserId, role);
      setSelectedUserId('');
      setRole('viewer');
    } catch (error: any) {
      setValidationError(error.message || 'Failed to add member');
    }
  };

  const isFormDisabled = disabled || isLoading;

  if (availableMembers.length === 0) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          No organization members available to add. Only "Viewer" organization members can be added to teams, 
          and all eligible members are already part of this team.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="member">Organization Member</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isFormDisabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select a member to add" />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex flex-col">
                    <span>{member.full_name || member.email}</span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="role">Team Role</Label>
          <Select value={role} onValueChange={setRole} disabled={isFormDisabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isFormDisabled || !selectedUserId}
        className="w-full md:w-auto"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {isLoading ? 'Adding Member...' : 'Add Member'}
      </Button>
    </form>
  );
}
