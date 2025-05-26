
import { Organization } from '@/types';

interface TeamManagementHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  selectedOrganization?: Organization | null;
}

export function TeamManagementHeader({
  onRefresh,
  isLoading,
  selectedOrganization
}: TeamManagementHeaderProps) {
  const getDescriptionText = () => {
    if (!selectedOrganization) {
      return "Create and manage teams for your organization";
    }
    
    return `Create and manage teams for ${selectedOrganization.name}`;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold mb-1">Team Management</h1>
        <p className="text-muted-foreground">
          {getDescriptionText()}
        </p>
      </div>
    </div>
  );
}
