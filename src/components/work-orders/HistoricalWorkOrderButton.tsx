import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import WorkOrderFormEnhanced from './WorkOrderFormEnhanced';
import { useOrganization } from "@/contexts/OrganizationContext";

interface HistoricalWorkOrderButtonProps {
  equipmentId?: string;
  className?: string;
}

export const HistoricalWorkOrderButton: React.FC<HistoricalWorkOrderButtonProps> = ({
  equipmentId,
  className
}) => {
  const [showForm, setShowForm] = useState(false);
  const [historicalMode, setHistoricalMode] = useState(false);
  const { currentOrganization } = useOrganization();

  // Only show to organization admins - for now, show to all users with access
  if (!currentOrganization) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setHistoricalMode(true);
          setShowForm(true);
        }}
        className={className}
      >
        <History className="h-4 w-4 mr-2" />
        Add Historical Work Order
      </Button>

      <WorkOrderFormEnhanced
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setHistoricalMode(false);
        }}
        equipmentId={equipmentId}
        initialIsHistorical={historicalMode}
      />
    </>
  );
};