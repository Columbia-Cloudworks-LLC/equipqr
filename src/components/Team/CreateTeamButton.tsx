
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateTeamButtonProps {
  onCreateTeam: (name: string) => Promise<any>;
  isCreating: boolean;
  disabled?: boolean;
}

export function CreateTeamButton({ onCreateTeam, isCreating, disabled = false }: CreateTeamButtonProps) {
  const [teamName, setTeamName] = useState('');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await onCreateTeam(teamName.trim());
      if (result.success) {
        toast.success('Team created successfully', {
          description: `Team "${teamName}" has been created.`,
        });
        setTeamName('');
        setOpen(false);
      } else {
        toast.error('Failed to create team', {
          description: result.error || 'An unknown error occurred.',
        });
      }
    } catch (error: any) {
      toast.error('Error creating team', {
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="ml-2" 
          disabled={isCreating || disabled}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Team
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
