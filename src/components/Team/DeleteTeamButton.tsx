
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteTeamButtonProps {
  teamId: string;
  teamName: string;
  onDeleteTeam: (teamId: string) => Promise<void>;
  isDeleting?: boolean;
  hasEquipment?: boolean;
  equipmentCount?: number;
  onBeforeDelete?: () => Promise<void>;
}

export function DeleteTeamButton({ 
  teamId, 
  teamName, 
  onDeleteTeam, 
  isDeleting = false,
  hasEquipment = false,
  equipmentCount = 0,
  onBeforeDelete
}: DeleteTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localDeleting, setLocalDeleting] = useState(false);
  
  // Combined deleting state for better UX
  const isInProgress = isDeleting || localDeleting;
  
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && onBeforeDelete) {
      try {
        await onBeforeDelete();
      } catch (err) {
        console.error('Error in onBeforeDelete:', err);
      }
    }
    setOpen(isOpen);
  };
  
  const handleDelete = async () => {
    try {
      setError(null);
      setLocalDeleting(true);
      
      await onDeleteTeam(teamId);
      toast.success(`Team "${teamName}" successfully deleted`);
      // Always close the dialog on success
      setOpen(false);
    } catch (err: any) {
      console.error('Delete team error:', err);
      
      // Handle specific known errors
      if (err.message && err.message.includes('permission')) {
        setError('You do not have permission to delete this team. You need to be a team manager or organization owner.');
      } else if (err.message && err.message.includes('not found')) {
        setError('Team not found or has already been deleted.');
        // Close dialog after a short delay since it's already deleted
        setTimeout(() => setOpen(false), 2000);
      } else {
        setError(err.message || 'Failed to delete team. Please try again.');
      }
      
      // Show toast for immediate feedback
      toast.error('Delete team failed', {
        description: err.message || 'An error occurred while deleting the team'
      });
      
      // Keep dialog open so user can see the error
    } finally {
      setLocalDeleting(false);
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <Button 
        variant="destructive" 
        size="sm"
        className="flex items-center gap-2"
        onClick={() => handleOpenChange(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete Team
      </Button>
      
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
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 my-2">
                <p className="font-medium text-red-800">Error: {error}</p>
                <p className="text-red-700 text-sm mt-1">
                  Please try again or contact support if the problem persists.
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
            disabled={isInProgress}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isInProgress}
          >
            {isInProgress ? 'Deleting...' : 'Delete Team'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
