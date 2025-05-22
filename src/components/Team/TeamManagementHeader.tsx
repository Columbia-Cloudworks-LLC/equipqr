
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { OrganizationSelector } from "@/components/Organization/OrganizationSelector";
import { Organization } from "@/types";

interface TeamManagementHeaderProps {
  organizations: Organization[];
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
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 className="text-2xl font-bold">Team Management</h1>
      <div className="flex items-center gap-2">
        {organizations.length > 1 && (
          <OrganizationSelector
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            onChange={onChange}
            className="w-[200px]"
            disabled={isChangingOrg}
          />
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={isLoading || isChangingOrg}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
}
