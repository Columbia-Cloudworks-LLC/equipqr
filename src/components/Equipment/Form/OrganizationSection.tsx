
import { Label } from '@/components/ui/label';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { ExternalOrgAlert } from './ExternalOrgAlert';
import { UserOrganization } from '@/services/organization/userOrganizations';

interface OrganizationSectionProps {
  organizations: UserOrganization[];
  selectedOrgId: string;
  isEditing: boolean;
  isExternalOrg: boolean;
  onChange: (value: string) => void;
}

export function OrganizationSection({ 
  organizations, 
  selectedOrgId, 
  isEditing, 
  isExternalOrg, 
  onChange 
}: OrganizationSectionProps) {
  // For editing, just show the external org alert if applicable
  if (isEditing) {
    return isExternalOrg ? <ExternalOrgAlert /> : null;
  }
  
  // For new equipment, show organization selector only if user has multiple orgs with create permissions
  const shouldShowSelector = organizations.length > 1;
  
  if (!shouldShowSelector) {
    // Even with single org, show external org alert if applicable
    return isExternalOrg ? <ExternalOrgAlert /> : null;
  }
  
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="org_id">Organization</Label>
        <OrganizationSelector
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          onChange={onChange}
          className="w-full"
          disabled={isEditing}
          placeholder="Select organization where you can create equipment"
        />
      </div>
      
      {isExternalOrg && <ExternalOrgAlert />}
    </>
  );
}
