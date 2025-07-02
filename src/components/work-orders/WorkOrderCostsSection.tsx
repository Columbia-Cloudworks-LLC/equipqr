
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useWorkOrderCosts } from '@/hooks/useWorkOrderCosts';
import InlineEditWorkOrderCosts from './InlineEditWorkOrderCosts';

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
  const { data: costs = [], isLoading } = useWorkOrderCosts(workOrderId);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Itemized Costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <InlineEditWorkOrderCosts
          costs={costs}
          workOrderId={workOrderId}
          canEdit={canAddCosts || canEditCosts}
        />
      </CardContent>
    </Card>
  );
};

export default WorkOrderCostsSection;
