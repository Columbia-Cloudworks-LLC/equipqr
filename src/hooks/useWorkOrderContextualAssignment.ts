import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentOption {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export function useWorkOrderContextualAssignment(workOrder: any) {
  const { data: assignmentOptions = [], isLoading, error } = useQuery({
    queryKey: ['workOrderContextualAssignment', workOrder?.id, workOrder?.equipment_id],
    queryFn: async (): Promise<AssignmentOption[]> => {
      if (!workOrder?.equipment_id || !workOrder?.organization_id) {
        return [];
      }

      // First, get the equipment details to check if it has a team
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('team_id')
        .eq('id', workOrder.equipment_id)
        .single();

      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
        throw equipmentError;
      }

      // If equipment is assigned to a team, get team members
      if (equipment.team_id) {
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            role,
            profiles!inner(
              id,
              name,
              email
            )
          `)
          .eq('team_id', equipment.team_id);

        if (teamError) {
          console.error('Error fetching team members:', teamError);
          throw teamError;
        }

        return teamMembers.map(member => ({
          id: member.user_id,
          name: member.profiles.name,
          email: member.profiles.email,
          role: member.role
        }));
      } else {
        // If equipment is not assigned to a team, get only org admins and owners
        const { data: orgMembers, error: orgError } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            role,
            profiles!inner(
              id,
              name,
              email
            )
          `)
          .eq('organization_id', workOrder.organization_id)
          .eq('status', 'active')
          .in('role', ['owner', 'admin']);

        if (orgError) {
          console.error('Error fetching organization members:', orgError);
          throw orgError;
        }

        return orgMembers.map(member => ({
          id: member.user_id,
          name: member.profiles.name,
          email: member.profiles.email,
          role: member.role
        }));
      }
    },
    enabled: !!(workOrder?.equipment_id && workOrder?.organization_id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    assignmentOptions,
    isLoading,
    error,
    hasTeamAssignment: !!workOrder?.equipment_id && assignmentOptions.length > 0
  };
}