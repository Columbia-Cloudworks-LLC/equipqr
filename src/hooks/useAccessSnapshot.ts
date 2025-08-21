
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AccessSnapshotProfile {
  id: string;
  name: string;
  email: string;
}

export interface AccessSnapshotOrganization {
  id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
}

export interface AccessSnapshot {
  organizations: AccessSnapshotOrganization[];
  accessibleTeamIds: string[];
  profiles: AccessSnapshotProfile[];
}

export const useAccessSnapshot = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['access-snapshot', user?.id],
    queryFn: async (): Promise<AccessSnapshot> => {
      if (!user) {
        return {
          organizations: [],
          accessibleTeamIds: [],
          profiles: []
        };
      }

      // Use .rpc() method with proper typing
      const { data, error } = await supabase.rpc('get_user_access_snapshot' as any, {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error fetching access snapshot:', error);
        throw error;
      }

      // Safely cast the return data
      const accessData = data as AccessSnapshot;
      
      return accessData || {
        organizations: [],
        accessibleTeamIds: [],
        profiles: []
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
