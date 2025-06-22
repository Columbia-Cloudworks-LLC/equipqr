
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, User, Shield, Info, UserCheck } from 'lucide-react';
import { EnhancedAssignmentOption } from '@/hooks/useWorkOrderAssignmentEnhanced';

interface EnhancedWorkOrderAssignmentSelectorProps {
  options: EnhancedAssignmentOption[];
  value?: string;
  onChange: (value: string, type: 'team' | 'member' | 'admin') => void;
  placeholder?: string;
  disabled?: boolean;
  hasEquipmentTeam?: boolean;
  assignmentStrategy: 'team_based' | 'admin_based';
  teamName?: string;
}

const EnhancedWorkOrderAssignmentSelector: React.FC<EnhancedWorkOrderAssignmentSelectorProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select assignee",
  disabled = false,
  hasEquipmentTeam = true,
  assignmentStrategy,
  teamName
}) => {
  const handleChange = (selectedValue: string) => {
    const option = options.find(opt => opt.id === selectedValue);
    if (option) {
      onChange(selectedValue, option.type);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users className="h-4 w-4" />;
      case 'member':
        return <User className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string, canSelfAssign?: boolean) => {
    switch (type) {
      case 'team':
        return 'Team';
      case 'member':
        return canSelfAssign ? 'You' : 'Member';
      case 'admin':
        return canSelfAssign ? 'You (Admin)' : 'Admin';
      default:
        return '';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'team':
        return 'default';
      case 'member':
        return 'secondary';
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Group options by type for better organization
  const teamOptions = options.filter(opt => opt.type === 'team');
  const memberOptions = options.filter(opt => opt.type === 'member');
  const adminOptions = options.filter(opt => opt.type === 'admin');

  return (
    <div className="space-y-3">
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No assignees available
            </div>
          ) : (
            <>
              {/* Team Options */}
              {teamOptions.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Team Assignment
                  </div>
                  {teamOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2 w-full">
                        {getIcon(option.type)}
                        <span className="flex-1">{option.name}</span>
                        <Badge variant={getTypeBadgeVariant(option.type)} className="text-xs">
                          {getTypeLabel(option.type, option.canSelfAssign)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {/* Member Options */}
              {memberOptions.length > 0 && (
                <>
                  {teamOptions.length > 0 && <div className="border-t my-1" />}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Team Members
                  </div>
                  {memberOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2 w-full">
                        {getIcon(option.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span>{option.name}</span>
                            {option.canSelfAssign && <UserCheck className="h-3 w-3 text-blue-500" />}
                          </div>
                          {option.email && (
                            <div className="text-xs text-muted-foreground">{option.email}</div>
                          )}
                        </div>
                        <Badge variant={getTypeBadgeVariant(option.type)} className="text-xs">
                          {option.role || getTypeLabel(option.type, option.canSelfAssign)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {/* Admin Options */}
              {adminOptions.length > 0 && (
                <>
                  {(teamOptions.length > 0 || memberOptions.length > 0) && <div className="border-t my-1" />}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Organization Admins
                  </div>
                  {adminOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2 w-full">
                        {getIcon(option.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span>{option.name}</span>
                            {option.canSelfAssign && <UserCheck className="h-3 w-3 text-blue-500" />}
                          </div>
                          {option.email && (
                            <div className="text-xs text-muted-foreground">{option.email}</div>
                          )}
                        </div>
                        <Badge variant={getTypeBadgeVariant(option.type)} className="text-xs">
                          {getTypeLabel(option.type, option.canSelfAssign)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </>
          )}
        </SelectContent>
      </Select>
      
      {/* Assignment Strategy Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {assignmentStrategy === 'team_based' ? (
            <>
              This equipment is assigned to <strong>{teamName}</strong>. 
              You can assign work orders to the entire team, specific team members, or organization admins.
            </>
          ) : (
            <>
              This equipment has no assigned team. Work orders can only be assigned to organization admins.
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnhancedWorkOrderAssignmentSelector;
