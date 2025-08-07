import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, User, Wrench } from "lucide-react";
import { format } from "date-fns";
import { HistoricalWorkOrder, PreventativeMaintenance } from '@/types/workOrderDetails';


interface EquipmentHistoricalWorkOrdersTabProps {
  equipmentId: string;
  organizationId: string;
}

export const EquipmentHistoricalWorkOrdersTab: React.FC<EquipmentHistoricalWorkOrdersTabProps> = ({
  equipmentId,
  organizationId
}) => {
  const { data: historicalWorkOrders = [], isLoading } = useQuery({
    queryKey: ['historicalWorkOrders', equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          preventative_maintenance (
            id,
            status,
            completed_at,
            notes,
            is_historical,
            historical_completion_date
          )
        `)
        .eq('equipment_id', equipmentId)
        .eq('organization_id', organizationId)
        .eq('is_historical', true)
        .order('historical_start_date', { ascending: false });

      if (error) {
        console.error('Error fetching historical work orders:', error);
        throw error;
      }

      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Historical Work Orders</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Historical Work Orders</h3>
        <Badge variant="secondary">{historicalWorkOrders.length}</Badge>
      </div>

      {historicalWorkOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Historical Records</h4>
            <p className="text-muted-foreground mb-4">
              No historical work orders have been recorded for this equipment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historicalWorkOrders.map((workOrder: HistoricalWorkOrder) => (
            <Card key={workOrder.id} className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {workOrder.title}
                      <Badge variant="outline">
                        {workOrder.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {workOrder.historical_start_date && 
                          format(new Date(workOrder.historical_start_date), 'MMM dd, yyyy')}
                      </div>
                      {workOrder.assignee_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {workOrder.assignee_name}
                        </div>
                      )}
                      {workOrder.preventative_maintenance?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Wrench className="h-4 w-4" />
                          PM Included
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <History className="h-3 w-3" />
                      Historical
                    </Badge>
                    <Badge 
                      variant={
                        workOrder.priority === 'high' ? 'destructive' :
                        workOrder.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {workOrder.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {workOrder.description}
                </p>
                
                {workOrder.historical_notes && (
                  <div className="bg-muted/50 p-3 rounded-md mb-3">
                    <h5 className="font-medium text-sm mb-1">Historical Notes:</h5>
                    <p className="text-sm text-muted-foreground">
                      {workOrder.historical_notes}
                    </p>
                  </div>
                )}

                {workOrder.preventative_maintenance?.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      Preventative Maintenance
                    </h5>
                    {workOrder.preventative_maintenance.map((pm: PreventativeMaintenance) => (
                      <div key={pm.id} className="flex items-center justify-between text-sm">
                        <span>Status: {pm.status}</span>
                        {pm.historical_completion_date && (
                          <span className="text-muted-foreground">
                            Completed: {format(new Date(pm.historical_completion_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
                  <span>Created by: {workOrder.created_by_name || 'System'}</span>
                  {workOrder.completed_date && (
                    <span>Completed: {format(new Date(workOrder.completed_date), 'MMM dd, yyyy')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};