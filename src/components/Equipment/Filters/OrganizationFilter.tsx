
import { Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Organization {
  id: string;
  name: string;
  role?: string;
  is_primary?: boolean;
}

interface OrganizationFilterProps {
  organizations: Organization[];
  selectedOrgId?: string;
  onChange: (orgId: string) => void;
}

export function OrganizationFilter({ organizations, selectedOrgId, onChange }: OrganizationFilterProps) {
  if (organizations.length <= 1) {
    return null; // Don't render if there's only one or no organizations
  }

  return (
    <Select value={selectedOrgId} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select organization" />
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
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
