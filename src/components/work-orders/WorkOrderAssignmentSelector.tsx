
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, User, Shield } from 'lucide-react';
import { AssignmentOption } from '@/hooks/useWorkOrderAssignment';

interface WorkOrderAssignmentSelectorProps {
  options: AssignmentOption[];
  value?: string;
  onChange: (value: string, type: 'team' | 'member' | 'admin') => void;
  placeholder?: string;
  disabled?: boolean;
  hasEquipmentTeam?: boolean;
}

const WorkOrderAssignmentSelector: React.FC<WorkOrderAssignmentSelectorProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select assignee",
  disabled = false,
  hasEquipmentTeam = true
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'team':
        return 'Team';
      case 'member':
        return 'Member';
      case 'admin':
        return 'Admin';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              {hasEquipmentTeam 
                ? "No team members available"
                : "No organization admins available"
              }
            </div>
          ) : (
            options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <div className="flex items-center gap-2">
                  {getIcon(option.type)}
                  <span>{option.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(option.type)}
                  </Badge>
                  {option.canSelfAssign && (
                    <Badge variant="secondary" className="text-xs">
                      Self
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {!hasEquipmentTeam && (
        <p className="text-xs text-muted-foreground">
          This equipment has no assigned team. Work orders will be assigned to organization admins.
        </p>
      )}
    </div>
  );
};

export default WorkOrderAssignmentSelector;
