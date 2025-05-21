
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrganizationSelectorProps {
  organizations: UserOrganization[];
  selectedOrgId?: string;
  onChange: (orgId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showRoleBadges?: boolean;
  filterViewerOrgs?: boolean; // New prop to filter orgs where user is just a viewer
}

export function OrganizationSelector({
  organizations,
  selectedOrgId,
  onChange,
  disabled = false,
  placeholder = "Select organization",
  className = "w-[200px]",
  showRoleBadges = true,
  filterViewerOrgs = false // Default to showing all orgs
}: OrganizationSelectorProps) {
  // Filter out organizations where user is just a viewer with no teams if requested
  const filteredOrgs = filterViewerOrgs 
    ? organizations.filter(org => org.role !== 'viewer' || org.hasTeams === true)
    : organizations;
  
  // Always show the selector if there are organizations, even if just one
  if (filteredOrgs.length === 0) {
    return null;
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
        {filteredOrgs.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center">
              <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              {org.name}
              {showRoleBadges && org.is_primary && (
                <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-blue-50">
                  Primary
                </Badge>
              )}
              {showRoleBadges && !org.is_primary && org.role && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-gray-50">
                        {org.role}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Your role in this organization</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
