
import { UserOrganization } from '@/services/organization/userOrganizations';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Organization } from '@/types';

interface TeamManagementHeaderProps {
  organizations: (UserOrganization | Organization)[];
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
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold mb-1">Team Management</h1>
        <p className="text-muted-foreground">
          Create and manage teams for your organization
        </p>
      </div>

      <div className="flex items-center gap-2">
        {organizations.length > 1 && (
          <Select
            value={selectedOrgId}
            onValueChange={onChange}
            disabled={isLoading || isChangingOrg}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                  {org.is_primary && " (Primary)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
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
