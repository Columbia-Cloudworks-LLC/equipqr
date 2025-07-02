
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';
import { useWorkOrderCosts } from '@/hooks/useWorkOrderCosts';
import WorkOrderCostForm from './WorkOrderCostForm';
import InlineEditWorkOrderCost from './InlineEditWorkOrderCost';

interface WorkOrderCostsSectionProps {
  workOrderId: string;
  canAddCosts: boolean;
  canEditCosts: boolean;
}

const WorkOrderCostsSection: React.FC<WorkOrderCostsSectionProps> = ({
  workOrderId,
  canAddCosts,
  canEditCosts
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: costs = [], isLoading } = useWorkOrderCosts(workOrderId);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };

  const calculateSubtotal = () => {
    return costs.reduce((sum, cost) => sum + cost.total_price_cents, 0);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Loading Costs...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Itemized Costs
            </CardTitle>
            {canAddCosts && (
              <Button onClick={() => setIsFormOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Cost
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No costs recorded yet</p>
              {canAddCosts && (
                <p className="text-sm">Add cost items to track expenses for this work order</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cost Items with Inline Editing */}
              <div className="space-y-2">
                {costs.map((cost) => (
                  <InlineEditWorkOrderCost
                    key={cost.id}
                    cost={cost}
                    canEdit={canEditCosts}
                  />
                ))}
              </div>

              {/* Subtotal */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Form Dialog for Adding New Items */}
      <WorkOrderCostForm
        open={isFormOpen}
        onClose={handleCloseForm}
        workOrderId={workOrderId}
      />
    </>
  );
};

export default WorkOrderCostsSection;
