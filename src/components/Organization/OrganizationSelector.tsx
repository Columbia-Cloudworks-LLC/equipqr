
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
import { truncateText } from '@/utils/textUtils';

interface OrganizationSelectorProps {
  organizations: UserOrganization[];
  selectedOrgId?: string;
  onChange: (orgId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showRoleBadges?: boolean;
  filterViewerOrgs?: boolean;
  maxDisplayLength?: number;
}

export function OrganizationSelector({
  organizations,
  selectedOrgId,
  onChange,
  disabled = false,
  placeholder = "Select organization",
  className = "w-[200px]",
  showRoleBadges = true,
  filterViewerOrgs = false,
  maxDisplayLength = 20
}: OrganizationSelectorProps) {
  // Filter out organizations where user is just a viewer with no teams if requested
  const filteredOrgs = filterViewerOrgs 
    ? organizations.filter(org => org.role !== 'viewer' || org.hasTeams === true)
    : organizations;
  
  // Always show the selector if there are organizations, even if just one
  if (filteredOrgs.length === 0) {
    return null;
  }

  // Sort organizations: primary first, then by name
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.name.localeCompare(b.name);
  });

  // Get the selected organization object for display
  const selectedOrg = selectedOrgId ? sortedOrgs.find(org => org.id === selectedOrgId) : undefined;
  
  // Get display name (truncated if needed)
  const getDisplayName = (name: string) => {
    return truncateText(name, maxDisplayLength);
  };

  return (
    <TooltipProvider>
      <Select 
        value={selectedOrgId} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder}>
                {selectedOrg && (
                  <div className="flex items-center">
                    <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                    <span className="truncate">{getDisplayName(selectedOrg.name)}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
          </TooltipTrigger>
          {selectedOrg && (
            <TooltipContent side="top">
              <p>{selectedOrg.name}</p>
            </TooltipContent>
          )}
        </Tooltip>
        <SelectContent className="min-w-[220px] max-w-[350px]">
          {sortedOrgs.map((org) => (
            <SelectItem key={org.id} value={org.id} className="flex justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-wrap gap-1">
                  <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                  <span className="break-words">{org.name}</span>
                  {showRoleBadges && (
                    <div className="flex gap-1 flex-wrap ml-1">
                      {org.is_primary && (
                        <Badge variant="outline" className="px-1 py-0 text-[10px] h-4 bg-blue-50 border-blue-200 text-blue-700">
                          Primary
                        </Badge>
                      )}
                      {!org.is_primary && org.role && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="px-1 py-0 text-[10px] h-4 bg-gray-50 border-gray-200">
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
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TooltipProvider>
  );
}
