import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { HistoricalWorkOrderForm } from "./form/HistoricalWorkOrderForm";
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
        onClick={() => setShowForm(true)}
        className={className}
      >
        <History className="h-4 w-4 mr-2" />
        Add Historical Work Order
      </Button>

      <HistoricalWorkOrderForm
        open={showForm}
        onClose={() => setShowForm(false)}
        equipmentId={equipmentId}
      />
    </>
  );
};