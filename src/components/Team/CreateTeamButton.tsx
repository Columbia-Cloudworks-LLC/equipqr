
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface CreateTeamButtonProps {
  onCreateTeam: (name: string) => Promise<any>;
  isCreating: boolean;
  disabled?: boolean;
}

export function CreateTeamButton({ onCreateTeam, isCreating, disabled = false }: CreateTeamButtonProps) {
  const [teamName, setTeamName] = useState('');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Team name cannot be empty');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onCreateTeam(teamName.trim());
      
      // Check for successful result or legacy API response shape
      if (result?.id || result?.success) {
        toast.success('Team created successfully', {
          description: `Team "${teamName}" has been created.`,
        });
        setTeamName('');
        setOpen(false);
      } else {
        // Handle unexpected response format
        setError('Unexpected response from server. Please try again.');
        toast.error('Failed to create team', {
          description: 'Server returned an unexpected response',
        });
      }
    } catch (error: any) {
      // Extract most meaningful error message
      const errorMessage = error.message || 
                          error.error?.message || 
                          error.details || 
                          'An unknown error occurred.';
      
      // Special handling for common errors
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes('foreign key constraint') || 
          errorMessage.includes('not present in table')) {
        userFriendlyMessage = 'Your user account needs reconnecting. Please try logging out and back in.';
      }
      
      setError(userFriendlyMessage);
      toast.error('Error creating team', {
        description: userFriendlyMessage,
      });
      console.error('Team creation error details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
      setTeamName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
            <Button type="submit" disabled={isSubmitting || !teamName.trim()}>
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
