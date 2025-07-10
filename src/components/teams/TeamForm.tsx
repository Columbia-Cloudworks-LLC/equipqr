
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from '@/contexts/OrganizationContext';
import { updateTeam } from '@/services/teamService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeamMutations } from '@/hooks/useTeamManagement';
import { useAuth } from '@/contexts/AuthContext';

interface TeamFormProps {
  open: boolean;
  onClose: () => void;
  team?: any;
}

const TeamForm: React.FC<TeamFormProps> = ({ open, onClose, team }) => {
  const isEdit = !!team;
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { createTeamWithCreator } = useTeamMutations();
  
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateTeam(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['team', team?.id] });
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit) {
        updateTeamMutation.mutate({
          id: team.id,
          updates: {
            name: formData.name.trim(),
            description: formData.description.trim() || null
          }
        });
      } else {
        createTeamWithCreator.mutate({
          teamData: {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            organization_id: currentOrganization.id
          },
          creatorId: user.id
        }, {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Team created successfully",
            });
            onClose();
            setFormData({ name: '', description: '' });
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update team information' : 'Enter the details for the new team'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-4 space-y-4">
               <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Maintenance Team"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the team's responsibilities..."
                  className="min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createTeamWithCreator.isPending || updateTeamMutation.isPending}
            >
              {(isSubmitting || createTeamWithCreator.isPending || updateTeamMutation.isPending) 
                ? (isEdit ? 'Updating...' : 'Creating...') 
                : (isEdit ? 'Update Team' : 'Create Team')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamForm;
