import React, { useState, useCallback } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
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

  const handleAssignment = useCallback(async (assignmentData: { type: 'member' | 'team' | 'admin' | 'unassign', id?: string }) => {
    if (!currentOrganization || isAssigning) return;
    
    setIsAssigning(true);
    try {
      let assigneeId = null;
      let teamId = null;
      
      if (assignmentData.type === 'member' || assignmentData.type === 'admin') {
        assigneeId = assignmentData.id;
      } else if (assignmentData.type === 'team') {
        teamId = assignmentData.id;
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
    <HoverCard openDelay={500} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="top">
        <div className="space-y-3">
          <div className="text-sm font-medium">Quick Assignment</div>
          
          {!assignmentData.availableAssignees ? (
            <div className="text-xs text-muted-foreground">Loading options...</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {assignmentData.hasEquipmentTeam 
                    ? `Assign to ${assignmentData.suggestedTeamName} members or admins`
                    : "Assign to organization admins"
                  }
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
                      const isFirstTeamAssignee = assignee.type === 'team';
                      const isFirstAdmin = assignee.type === 'admin' && 
                        !assignmentData.availableAssignees.slice(0, index).some(a => a.type === 'admin');
                      const showDivider = (isFirstTeamAssignee || isFirstAdmin) && index > 0;
                      
                      return (
                        <React.Fragment key={assignee.id}>
                          {showDivider && <div className="border-t my-1" />}
                          {isFirstTeamAssignee && (
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Team Assignment</div>
                          )}
                          {isFirstAdmin && (
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                              {assignmentData.hasEquipmentTeam ? 'Backup Admins' : 'Organization Admins'}
                            </div>
                          )}
                          <SelectItem value={assignee.id}>
                            <div className="flex items-center gap-2">
                              {assignee.type === 'team' && <Users className="h-3 w-3" />}
                              {assignee.type === 'member' && <User className="h-3 w-3" />}
                              {assignee.type === 'admin' && <Shield className="h-3 w-3" />}
                              {assignee.name}
                            </div>
                          </SelectItem>
                        </React.Fragment>
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
      </HoverCardContent>
    </HoverCard>
  );
};