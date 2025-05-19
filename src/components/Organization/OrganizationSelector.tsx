
import { Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserOrganization } from '@/services/organization/userOrganizations';

interface OrganizationSelectorProps {
  organizations: UserOrganization[];
  selectedOrgId?: string;
  onChange: (orgId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function OrganizationSelector({
  organizations,
  selectedOrgId,
  onChange,
  disabled = false,
  placeholder = "Select organization",
  className = "w-[200px]"
}: OrganizationSelectorProps) {
  if (organizations.length <= 0) {
    return null; // Don't render if there are no organizations
  }

  return (
    <Select 
      value={selectedOrgId} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center">
              <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              {org.name}
              {org.is_primary && (
                <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-blue-50">
                  Primary
                </Badge>
              )}
              {!org.is_primary && org.role && (
                <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-gray-50">
                  {org.role}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
