
import { Label } from '@/components/ui/label';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { ExternalOrgAlert } from './ExternalOrgAlert';

interface OrganizationSectionProps {
  organizations: any[];
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
  
  // For new equipment, only show organization selector if there are multiple orgs
  if (organizations.length <= 1) {
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
        />
      </div>
      
      {isExternalOrg && <ExternalOrgAlert />}
    </>
  );
}
