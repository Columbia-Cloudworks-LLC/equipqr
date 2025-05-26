
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface RoleDefinition {
  name: string;
  description: string;
}

interface RoleInfoTooltipProps {
  type: 'organization' | 'team';
  className?: string;
}

const organizationRoles: RoleDefinition[] = [
  {
    name: 'Owner',
    description: 'Full control over the organization, can manage all settings, members, and transfer ownership.'
  },
  {
    name: 'Manager', 
    description: 'Can manage organization members, create teams, and access all equipment within the organization.'
  },
  {
    name: 'Viewer',
    description: 'Read-only access to organization resources and equipment assigned to their teams.'
  }
];

const teamRoles: RoleDefinition[] = [
  {
    name: 'Manager',
    description: 'Can invite/remove team members, assign equipment, and manage team settings.'
  },
  {
    name: 'Technician',
    description: 'Can view and edit equipment records, add work notes (public and private), and perform maintenance tasks.'
  },
  {
    name: 'Requestor',
    description: 'Can request work orders and view equipment assigned to the team.'
  },
  {
    name: 'Viewer',
    description: 'Read-only access to team equipment and public work notes.'
  }
];

export function RoleInfoTooltip({ type, className = "" }: RoleInfoTooltipProps) {
  const roles = type === 'organization' ? organizationRoles : teamRoles;
  const title = type === 'organization' ? 'Organization Roles' : 'Team Roles';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help ${className}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4 bg-popover border shadow-md">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{title}</h4>
            <div className="space-y-2">
              {roles.map((role) => (
                <div key={role.name} className="space-y-1">
                  <p className="font-medium text-xs text-primary">{role.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
