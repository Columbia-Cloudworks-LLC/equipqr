
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteEquipment } from '@/services/equipment';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface DeleteEquipmentButtonProps {
  equipmentId: string;
  equipmentName: string;
  canDelete?: boolean;
}

export function DeleteEquipmentButton({ 
  equipmentId, 
  equipmentName,
  canDelete = false 
}: DeleteEquipmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Don't render the button if user doesn't have permission
  if (!canDelete) {
    return null;
  }

  async function handleDelete() {
    if (!equipmentId) {
      toast.error('Missing equipment ID');
      return;
    }
    
    setError(null);
    setIsDeleting(true);
    
    try {
      await deleteEquipment(equipmentId);
      
      // Invalidate queries to refresh equipment list
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      
      // Close the dialog
      setIsOpen(false);
      
      // Navigate back to equipment list
      navigate('/equipment');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete equipment');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex gap-1 items-center"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action will delete the equipment "{equipmentName}". 
              This action cannot be undone, and the equipment record will be permanently removed.</p>
              
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md">
                  {error}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Equipment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
