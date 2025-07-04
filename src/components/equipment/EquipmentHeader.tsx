import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EquipmentHeaderProps {
  organizationName: string;
  canCreate: boolean;
  onAddEquipment: () => void;
}

const EquipmentHeader: React.FC<EquipmentHeaderProps> = ({
  organizationName,
  canCreate,
  onAddEquipment
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "space-y-4" : "flex items-center justify-between"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
        <p className="text-muted-foreground">
          Manage equipment for {organizationName}
        </p>
      </div>
      {canCreate && (
        <Button 
          onClick={onAddEquipment} 
          className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}
        >
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      )}
    </div>
  );
};

export default EquipmentHeader;