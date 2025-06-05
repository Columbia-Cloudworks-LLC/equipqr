
import Layout from '@/components/Layout/Layout';
import { AuthLoadingState } from '@/components/Team/AuthLoadingState';
import { TeamManagementView } from '@/components/Team/TeamManagementView';
import { TeamManagementProvider } from '@/contexts/TeamManagementContext';
import { useTeamManagementPage } from '@/hooks/team/useTeamManagementPage';

export default function TeamManagement() {
  const { contextValue, isAuthLoading, session } = useTeamManagementPage();
  
  // Show loading state during auth check
  if (isAuthLoading) {
    return (
      <Layout>
        <AuthLoadingState />
      </Layout>
    );
  }

  // If not authenticated, return empty - navigation will handle redirect
  if (!session) {
    return null;
  }

  return (
    <Layout>
      <TeamManagementProvider value={contextValue}>
        <TeamManagementView />
      </TeamManagementProvider>
    </Layout>
  );
}
