
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { duplicateEquipment } from '@/services/equipment/equipmentDuplicationService';

interface DuplicateEquipmentButtonProps {
  equipmentId: string;
  equipmentName: string;
  canDuplicate: boolean;
}

export function DuplicateEquipmentButton({ 
  equipmentId, 
  equipmentName, 
  canDuplicate 
}: DuplicateEquipmentButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const navigate = useNavigate();

  const handleDuplicate = async () => {
    if (!canDuplicate || isDuplicating) return;

    setIsDuplicating(true);
    
    try {
      console.log('Duplicating equipment:', equipmentId);
      
      const result = await duplicateEquipment(equipmentId);
      
      if (result.error || !result.equipment) {
        toast.error('Failed to duplicate equipment', {
          description: result.error || 'An unexpected error occurred'
        });
        return;
      }
      
      // Show success message with the new name
      toast.success('Equipment duplicated successfully', {
        description: `Created "${result.equipment.name}"`
      });
      
      // Navigate to the new equipment detail page
      navigate(`/equipment/${result.equipment.id}`);
      
    } catch (error: any) {
      console.error('Error duplicating equipment:', error);
      toast.error('Failed to duplicate equipment', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  if (!canDuplicate) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDuplicate}
      disabled={isDuplicating}
    >
      {isDuplicating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {isDuplicating ? 'Duplicating...' : 'Duplicate'}
    </Button>
  );
}
