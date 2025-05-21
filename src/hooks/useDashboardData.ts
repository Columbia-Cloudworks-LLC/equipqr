import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast from 'sonner';
import { getTeams } from '@/services/team/retrieval';

export function useDashboardData() {
  const [teamCount, setTeamCount] = useState<number>(0);
  const [equipmentCount, setEquipmentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch teams count
        const teams = await getTeams();
        const filteredTeams = selectedOrganization
          ? teams.filter((team) => team.org_id === selectedOrganization.id)
          : teams;
        setTeamCount(filteredTeams.length);

        // Fetch equipment count (mocked for now)
        setEquipmentCount(15);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        toast.error("Failed to load dashboard data", {
          description: err.message || "An unknown error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, selectedOrganization]);

  return {
    teamCount,
    equipmentCount,
    isLoading,
    error,
  };
}
