import React, { useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, UserX, Shield } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkOrderAssignmentEnhanced } from '@/hooks/useWorkOrderAssignmentEnhanced';
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
  
  const assignmentData = useWorkOrderAssignmentEnhanced(currentOrganization?.id, workOrder.equipment_id);
  const assignmentMutation = useQuickWorkOrderAssignment();

  const handleAssignment = useCallback(async (assignmentData: { type: 'admin' | 'unassign', id?: string }) => {
    if (!currentOrganization || isAssigning) return;
    
    setIsAssigning(true);
    try {
      let assigneeId = null;
      let teamId = null;
      
      if (assignmentData.type === 'admin') {
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
          
          {!assignmentData.availableAssignees || assignmentData.availableAssignees.length === 0 ? (
            <div className="text-xs text-muted-foreground">Loading options...</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Assign to organization admins
                </div>
                <Select 
                  onValueChange={(value) => {
                    const option = assignmentData.availableAssignees.find(opt => opt.id === value);
                    if (option) {
                      handleAssignment({ type: option.type, id: value });
                    }
                  }}
                  disabled={isAssigning}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select assignee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentData.availableAssignees.map((assignee, index) => {
                      const isFirstAdmin = assignee.type === 'admin' && index === 0;
                      
                      return (
                        <div key={assignee.id}>
                          {isFirstAdmin && (
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                              Organization Admins
                            </div>
                          )}
                          <SelectItem value={assignee.id}>
                            <div className="flex items-center gap-2">
                              {assignee.type === 'admin' && <Shield className="h-3 w-3" />}
                              {assignee.name}
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