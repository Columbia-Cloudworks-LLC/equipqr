
import { Building, Check } from 'lucide-react';
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
  defaultOrgId?: string | null;
  onChange: (orgId: string) => void;
  onSetDefault?: (orgId: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showRoleBadges?: boolean;
  filterViewerOrgs?: boolean;
  showSetDefault?: boolean;
}

export function OrganizationSelector({
  organizations,
  selectedOrgId,
  defaultOrgId,
  onChange,
  onSetDefault,
  disabled = false,
  placeholder = "Select organization",
  className = "w-[200px]",
  showRoleBadges = true,
  filterViewerOrgs = false,
  showSetDefault = false
}: OrganizationSelectorProps) {
  // Filter out organizations where user is just a viewer with no teams if requested
  const filteredOrgs = filterViewerOrgs 
    ? organizations.filter(org => org.role !== 'viewer' || org.hasTeams === true)
    : organizations;
  
  // Always show the selector if there are organizations, even if just one
  if (filteredOrgs.length === 0) {
    return null;
  }

  // Sort organizations: default first, then primary, then by name
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (a.id === defaultOrgId && b.id !== defaultOrgId) return -1;
    if (a.id !== defaultOrgId && b.id === defaultOrgId) return 1;
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.name.localeCompare(b.name);
  });

  // Handler for setting an organization as default
  const handleSetDefault = async (e: React.MouseEvent, orgId: string) => {
    e.stopPropagation();
    if (onSetDefault) {
      await onSetDefault(orgId);
    }
  };

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
        {sortedOrgs.map((org) => (
          <SelectItem key={org.id} value={org.id} className="flex justify-between items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                {org.name}
                {showRoleBadges && (
                  <div className="ml-2 flex gap-1">
                    {org.id === defaultOrgId && (
                      <Badge variant="outline" className="px-1 py-0 text-[10px] h-4 bg-green-50 border-green-200 text-green-700">
                        Default
                      </Badge>
                    )}
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
              
              {showSetDefault && org.id !== defaultOrgId && onSetDefault && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="ml-2 p-1 rounded-sm hover:bg-accent hover:text-accent-foreground" 
                        onClick={(e) => handleSetDefault(e, org.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Set as default</p>
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
