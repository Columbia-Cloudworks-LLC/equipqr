import React, { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, UserX } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOptimizedOrganizationMembers } from '@/hooks/useOptimizedOrganizationMembers';
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
  
  const { data: members = [] } = useOptimizedOrganizationMembers(currentOrganization?.id);
  const assignmentMutation = useQuickWorkOrderAssignment();

  const handleAssignment = async (type: 'user' | 'team' | 'unassign', id?: string) => {
    if (!currentOrganization || isAssigning) return;
    
    setIsAssigning(true);
    try {
      let assigneeId = null;
      let teamId = null;
      
      if (type === 'user') {
        assigneeId = id;
      } else if (type === 'team') {
        teamId = id;
      }
      
      await assignmentMutation.mutateAsync({
        workOrderId: workOrder.id,
        assigneeId,
        organizationId: currentOrganization.id
      });
      
      toast({
        title: "Assignment Updated",
        description: type === 'unassign' 
          ? "Work order unassigned successfully"
          : `Work order assigned to ${type} successfully`,
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
  };

  if (disabled) return <>{children}</>;

  return (
    <HoverCard openDelay={500} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="top">
        <div className="space-y-3">
          <div className="text-sm font-medium">Quick Assignment</div>
          
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Assign to Individual</div>
            <Select 
              onValueChange={(value) => handleAssignment('user', value)}
              disabled={isAssigning}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select member..." />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAssignment('unassign')}
            disabled={isAssigning}
            className="w-full h-8"
          >
            <UserX className="h-3 w-3 mr-1" />
            Unassign
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};