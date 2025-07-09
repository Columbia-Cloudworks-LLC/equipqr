
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Team } from '@/services/supabaseDataService';

interface AddTeamMemberDialogProps {
  open: boolean;
  onClose: () => void;
  team: Team;
}

const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({ 
  open, 
  onClose, 
  team 
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('technician');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const memberData = {
      email: formData.get('email') as string,
      role: selectedRole,
      teamId: team.id,
    };

    // In real implementation, this would call an add team member mutation
    console.log('Adding team member:', memberData);
    onClose();
  };

  const roleOptions = [
    { value: 'manager', label: 'Manager', description: 'Can manage team members and assign work orders' },
    { value: 'technician', label: 'Technician', description: 'Can update work orders and record maintenance' },
    { value: 'requestor', label: 'Requestor', description: 'Can create work orders and view assigned equipment' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to team resources' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join {team.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="member@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Team Role *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;
