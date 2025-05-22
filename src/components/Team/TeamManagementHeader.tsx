
import { UserOrganization } from '@/services/organization/userOrganizations';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCw } from 'lucide-react';
import { Organization } from '@/types';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';

interface TeamManagementHeaderProps {
  organizations: Organization[] | UserOrganization[];
  selectedOrgId: string | undefined;
  onChange: (orgId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isChangingOrg: boolean;
}

export function TeamManagementHeader({
  organizations,
  selectedOrgId,
  onChange,
  onRefresh,
  isLoading,
  isChangingOrg
}: TeamManagementHeaderProps) {
  const handleRefresh = () => {
    if (!isLoading) {
      onRefresh();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold mb-1">Team Management</h1>
        <p className="text-muted-foreground">
          Create and manage teams for your organization
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        {organizations.length > 1 && (
          <OrganizationSelector
            organizations={organizations as UserOrganization[]}
            selectedOrgId={selectedOrgId}
            onChange={onChange}
            disabled={isLoading || isChangingOrg}
            className="w-full sm:w-[220px] md:w-[250px] lg:w-[280px] mb-2 sm:mb-0"
            maxDisplayLength={22}
          />
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="sm:ml-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
