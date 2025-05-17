
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EditTeamButtonProps {
  teamId: string;
  teamName: string;
  onUpdateTeam: (teamId: string, name: string) => Promise<void>;
  isLoading?: boolean;
}

export function EditTeamButton({ 
  teamId, 
  teamName, 
  onUpdateTeam, 
  isLoading = false 
}: EditTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(teamName);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name !== teamName) {
      await onUpdateTeam(teamId, name);
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || name === teamName || isLoading}>
              {isLoading ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
