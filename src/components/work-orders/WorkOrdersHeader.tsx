import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WorkOrdersHeaderProps {
  onCreateClick: () => void;
}

export const WorkOrdersHeader: React.FC<WorkOrdersHeaderProps> = ({ onCreateClick }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage maintenance and repair work orders</p>
        </div>
        <Button onClick={onCreateClick} className="w-full h-12 text-base font-medium">
          <Plus className="h-5 w-5 mr-2" />
          Create Work Order
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
        <p className="text-muted-foreground">Manage maintenance and repair work orders</p>
      </div>
      <Button onClick={onCreateClick} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Work Order
      </Button>
    </div>
  );
};