
import { UserOrganization } from '@/services/organization/userOrganizations';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';

interface OrganizationFilterProps {
  organizations: UserOrganization[];
  selectedOrgId?: string;
  onChange: (orgId: string) => void;
  className?: string; // Added className as an optional prop
}

export function OrganizationFilter({
  organizations,
  selectedOrgId,
  onChange,
  className
}: OrganizationFilterProps) {
  if (organizations.length <= 1) {
    return null; // Don't show filter if there's only one or no organization
  }
  
  return (
    <OrganizationSelector
      organizations={organizations}
      selectedOrgId={selectedOrgId}
      onChange={onChange}
      placeholder="All Organizations"
      className={className || "min-w-[180px] w-full md:w-[220px] lg:w-[250px] max-w-full"}
      maxDisplayLength={20}
    />
  );
}
