import React, { useState, useCallback } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, UserX } from 'lucide-react';
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
  
  const { assignmentOptions, members, teams, isLoading } = useOptimizedWorkOrderAssignment(currentOrganization?.id);
  const assignmentMutation = useQuickWorkOrderAssignment();

  const handleAssignment = useCallback(async (assignmentData: { type: 'user' | 'team' | 'unassign', id?: string }) => {
    if (!currentOrganization || isAssigning) return;
    
    setIsAssigning(true);
    try {
      let assigneeId = null;
      let teamId = null;
      
      if (assignmentData.type === 'user') {
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
          : `Work order assigned to ${assignmentData.type} successfully`,
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
          
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading options...</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Assign to Member or Team</div>
                <Select 
                  onValueChange={(value) => {
                    const option = assignmentOptions.find(opt => opt.id === value);
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
                    {members.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Members</div>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {member.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {teams.length > 0 && (
                      <>
                        {members.length > 0 && <div className="border-t my-1" />}
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Teams</div>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
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