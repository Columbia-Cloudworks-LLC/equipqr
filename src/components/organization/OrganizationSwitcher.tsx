import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { cn } from '@/lib/utils';

interface OrganizationSwitcherProps {
  className?: string;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ className }) => {
  const { currentOrganization, userOrganizations, switchOrganization, isLoading } = useUnifiedOrganization();
  const navigate = useNavigate();

  const handleOrganizationSwitch = (organizationId: string) => {
    switchOrganization(organizationId);
    // Navigate to dashboard after switching organizations
    navigate('/');
  };

  if (!currentOrganization || isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-2", className)}>
        <div className="w-6 h-6 bg-muted rounded animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 bg-muted rounded animate-pulse w-16" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 w-full justify-between p-2 h-auto",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center flex-shrink-0">
              <Building className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate w-full text-left">
                {currentOrganization.name}
              </span>
              <div className="flex items-center gap-1">
                <Badge variant={currentOrganization.plan === 'premium' ? 'default' : 'secondary'} className="text-xs">
                  {currentOrganization.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {currentOrganization.userRole}
                </span>
              </div>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start" side="bottom">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userOrganizations.map((organization) => (
          <DropdownMenuItem
            key={organization.id}
            onClick={() => handleOrganizationSwitch(organization.id)}
            className="flex items-center gap-2 p-2 cursor-pointer"
            disabled={organization.userStatus !== 'active'}
          >
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center flex-shrink-0">
              <Building className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {organization.name}
                </span>
                {currentOrganization.id === organization.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge 
                  variant={organization.plan === 'premium' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {organization.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {organization.userRole}
                </span>
                {organization.userStatus !== 'active' && (
                  <Badge variant="outline" className="text-xs">
                    {organization.userStatus}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSwitcher;
