import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EquipmentHeaderProps {
  organizationName: string;
  canCreate: boolean;
  canImport: boolean;
  onAddEquipment: () => void;
  onImportCsv: () => void;
}

const EquipmentHeader: React.FC<EquipmentHeaderProps> = ({
  organizationName,
  canCreate,
  canImport,
  onAddEquipment,
  onImportCsv
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
      <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
        {canImport && (
          <Button 
            variant="outline"
            onClick={onImportCsv} 
            className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        )}
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
    </div>
  );
};

export default EquipmentHeader;