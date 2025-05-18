
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateTeamButtonProps {
  onCreateTeam: (name: string) => Promise<any>;
  isCreating: boolean;
}

export function CreateTeamButton({ onCreateTeam, isCreating = false }: CreateTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [localCreating, setLocalCreating] = useState(false);
  
  // Combined creating state for better UX
  const isInProgress = isCreating || localCreating;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) return;
    
    try {
      setLocalCreating(true);
      const newTeam = await onCreateTeam(teamName);
      
      if (newTeam) {
        // Close dialog only on success
        setOpen(false);
        setTeamName('');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      // Error is handled by the parent component
    } finally {
      setLocalCreating(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        variant="outline" 
        size="sm" 
        className="ml-2 flex items-center gap-1"
        disabled={isInProgress}
      >
        <Plus className="h-4 w-4" />
        New Team
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={isInProgress}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isInProgress}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isInProgress || !teamName.trim()}
              >
                {isInProgress ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
