import React, { useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, UserX, Shield } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOptimizedWorkOrderAssignment } from '@/hooks/useOptimizedWorkOrderAssignment';
import { useQuickWorkOrderAssignment } from '@/hooks/useQuickWorkOrderAssignment';
import { useToast } from '@/hooks/use-toast';

interface WorkOrderAssignmentHoverProps {
  workOrder: any;
  children: React.ReactNode;
  disabled?: boolean;
}

export const WorkOrderAssignmentHover: React.FC<WorkOrderAssignmentHoverProps> = ({
  workOrder,
  children,
  disabled = false
}) => {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { assignmentOptions, isLoading: assigneesLoading } = useOptimizedWorkOrderAssignment(currentOrganization?.id);
  const assignmentMutation = useQuickWorkOrderAssignment();

  const handleAssignment = useCallback(async (assignmentData: { type: 'user' | 'unassign', id?: string }) => {
    if (!currentOrganization || isAssigning) return;
    
    setIsAssigning(true);
    try {
      let assigneeId = null;
      let teamId = null;
      
      if (assignmentData.type === 'user') {
        assigneeId = assignmentData.id;
      }
      
      await assignmentMutation.mutateAsync({
        workOrderId: workOrder.id,
        assigneeId,
        teamId,
        organizationId: currentOrganization.id
      });
      
      toast({
        title: "Assignment Updated",
        description: assignmentData.type === 'unassign' 
          ? "Work order unassigned successfully"
          : `Work order assigned successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  }, [currentOrganization, isAssigning, assignmentMutation, workOrder.id, toast]);

  if (disabled) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <div className="space-y-3">
          <div className="text-sm font-medium">Quick Assignment</div>
          
          {assigneesLoading ? (
            <div className="text-xs text-muted-foreground">Loading options...</div>
          ) : assignmentOptions.length === 0 ? (
            <div className="text-xs text-muted-foreground">No admins available for assignment</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Assign to organization admins
                </div>
                <Select 
                  onValueChange={(value) => {
                    handleAssignment({ type: 'user', id: value });
                  }}
                  disabled={isAssigning}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select assignee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentOptions.map((assignee, index) => {
                      const isFirstAdmin = index === 0;
                      
                      return (
                        <div key={assignee.id}>
                          {isFirstAdmin && (
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                              Organization Admins
                            </div>
                          )}
                          <SelectItem value={assignee.id}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              <div>
                                <div className="font-medium">{assignee.name}</div>
                                <div className="text-xs text-muted-foreground">{assignee.role}</div>
                              </div>
                            </div>
                          </SelectItem>
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssignment({ type: 'unassign' })}
                disabled={isAssigning}
                className="w-full h-8"
              >
                <UserX className="h-3 w-3 mr-1" />
                Unassign
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};