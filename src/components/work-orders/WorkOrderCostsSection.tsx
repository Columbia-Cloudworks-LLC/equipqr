
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useWorkOrderCosts, useDeleteWorkOrderCost } from '@/hooks/useWorkOrderCosts';
import { WorkOrderCost } from '@/services/workOrderCostsService';
import WorkOrderCostForm from './WorkOrderCostForm';

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
  const [editingCost, setEditingCost] = useState<WorkOrderCost | null>(null);
  
  const { data: costs = [], isLoading } = useWorkOrderCosts(workOrderId);
  const deleteCostMutation = useDeleteWorkOrderCost();

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

  const handleEditCost = (cost: WorkOrderCost) => {
    setEditingCost(cost);
    setIsFormOpen(true);
  };

  const handleDeleteCost = (costId: string) => {
    if (window.confirm('Are you sure you want to delete this cost item?')) {
      deleteCostMutation.mutate(costId);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCost(null);
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
              {/* Cost Items */}
              <div className="space-y-2">
                {costs.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{cost.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {cost.quantity} × {formatCurrency(cost.unit_price_cents)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Added by {cost.created_by_name} on{' '}
                        {new Date(cost.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(cost.total_price_cents)}
                      </span>
                      {canEditCosts && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCost(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCost(cost.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Cost Form Dialog */}
      <WorkOrderCostForm
        open={isFormOpen}
        onClose={handleCloseForm}
        workOrderId={workOrderId}
        editingCost={editingCost}
      />
    </>
  );
};

export default WorkOrderCostsSection;
