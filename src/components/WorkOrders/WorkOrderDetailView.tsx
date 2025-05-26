
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Edit2, 
  FileText,
  MessageSquare,
  Building2
} from 'lucide-react';
import { WorkOrder, UpdateWorkOrderParams } from '@/types/workOrders';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import { WorkOrderEditForm } from './WorkOrderEditForm';
import { WorkOrderWorkNotes } from './WorkOrderWorkNotes';
import { format } from 'date-fns';

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder;
  canManage: boolean;
  onUpdate: (id: string, updates: UpdateWorkOrderParams) => Promise<void>;
  onBack: () => void;
}

export function WorkOrderDetailView({ 
  workOrder, 
  canManage, 
  onUpdate, 
  onBack 
}: WorkOrderDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={onBack} className="p-0 h-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Orders
          </Button>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {workOrder.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Work Order #{workOrder.id.slice(0, 8)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(workOrder.submitted_at), 'MMM d, yyyy')}
                  </div>
                  {workOrder.submitted_by_name && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {workOrder.submitted_by_name}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <WorkOrderStatusBadge status={workOrder.status} />
                {workOrder.equipment_name && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {workOrder.equipment_name}
                  </Badge>
                )}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
            </div>
            
            {workOrder.estimated_hours && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated: {workOrder.estimated_hours}h</span>
                {workOrder.assigned_to_name && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Assigned to: {workOrder.assigned_to_name}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Work Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {isEditing ? (
              <WorkOrderEditForm
                workOrder={workOrder}
                onUpdate={onUpdate}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                    <p className="text-sm leading-relaxed">
                      {workOrder.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                      <WorkOrderStatusBadge status={workOrder.status} />
                    </div>
                    
                    {workOrder.estimated_hours && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Estimated Hours</h4>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{workOrder.estimated_hours}h</span>
                        </div>
                      </div>
                    )}
                    
                    {workOrder.submitted_by_name && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Submitted By</h4>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{workOrder.submitted_by_name}</span>
                        </div>
                      </div>
                    )}
                    
                    {workOrder.assigned_to_name && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h4>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{workOrder.assigned_to_name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Submitted:</span>{' '}
                      {format(new Date(workOrder.submitted_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                    
                    {workOrder.completed_at && (
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {format(new Date(workOrder.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkOrderWorkNotes 
                  workOrderId={workOrder.id}
                  equipmentId={workOrder.equipment_id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
