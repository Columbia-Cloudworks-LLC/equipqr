
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteTeamButtonProps {
  teamId: string;
  teamName: string;
  onDeleteTeam: (teamId: string) => Promise<void>;
  isDeleting?: boolean;
  hasEquipment?: boolean;
  equipmentCount?: number;
}

export function DeleteTeamButton({ 
  teamId, 
  teamName, 
  onDeleteTeam, 
  isDeleting = false,
  hasEquipment = false,
  equipmentCount = 0
}: DeleteTeamButtonProps) {
  const [open, setOpen] = useState(false);
  
  const handleDelete = async () => {
    await onDeleteTeam(teamId);
    setOpen(false);
  };
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Team</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete the team "{teamName}"?</p>
            
            {hasEquipment && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 my-2">
                <p className="font-medium text-amber-800">
                  This team has {equipmentCount} equipment record{equipmentCount !== 1 ? 's' : ''} assigned to it.
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  When you delete this team, these equipment records will be unassigned from the team but will remain in your organization's inventory.
                </p>
              </div>
            )}
            
            <p>This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
