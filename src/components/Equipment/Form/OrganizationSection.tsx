
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
  // Only show organization selector if there are multiple orgs and we're not editing
  if (organizations.length <= 1 || isEditing) {
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
