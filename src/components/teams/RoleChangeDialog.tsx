
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamWithMembers } from '@/services/teamService';

interface RoleChangeDialogProps {
  open: boolean;
  onClose: () => void;
  member: any;
  team: TeamWithMembers;
}

const RoleChangeDialog: React.FC<RoleChangeDialogProps> = ({ 
  open, 
  onClose, 
  member,
  team 
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(member?.role || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!member) return;

    // In real implementation, this would call an update team member role mutation
    console.log('Updating member role:', {
      memberId: member.id,
      teamId: team.id,
      newRole: selectedRole,
      oldRole: member.role
    });
    
    onClose();
  };

  const roleOptions = [
    { value: 'manager', label: 'Manager', description: 'Can manage team members and assign work orders' },
    { value: 'technician', label: 'Technician', description: 'Can update work orders and record maintenance' },
    { value: 'requestor', label: 'Requestor', description: 'Can create work orders and view assigned equipment' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to team resources' },
  ];

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Team Role</DialogTitle>
          <DialogDescription>
            Update the team role for {member.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {/* Member Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">New Team Role *</Label>
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

              {selectedRole !== member.role && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Role Change:</strong> {member.role} → {selectedRole}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={selectedRole === member.role}
            >
              Update Role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleChangeDialog;
