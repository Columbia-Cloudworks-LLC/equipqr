
import { Link } from 'react-router-dom';
import { Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrCode, Users, Building } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EquipmentTableRowProps {
  equipment: Equipment;
}

export function EquipmentTableRow({ equipment }: EquipmentTableRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ensure organization name is never empty with enhanced validation
  const orgName = equipment.org_name || 'Unknown Organization';
  
  // Enhanced team name handling with better fallback logic
  const getTeamDisplay = () => {
    if (equipment.team_name) {
      return (
        <div className="flex items-center">
          <Users className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span>{equipment.team_name}</span>
        </div>
      );
    } else if (equipment.team_id) {
      // Has team_id but no team_name - show warning
      return (
        <div className="flex items-center">
          <Users className="h-3.5 w-3.5 text-yellow-500 mr-1" />
          <span className="text-yellow-600 text-sm">Team Data Missing</span>
        </div>
      );
    } else {
      // No team assigned
      return <span className="text-muted-foreground text-sm">No Team</span>;
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{equipment.name}</TableCell>
      <TableCell>{equipment.model || 'N/A'}</TableCell>
      <TableCell>{equipment.serial_number || 'N/A'}</TableCell>
      <TableCell>
        <Badge variant="outline" className={getStatusColor(equipment.status)}>
          {equipment.status}
        </Badge>
      </TableCell>
      <TableCell>
        {getTeamDisplay()}
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Building className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span>
            {orgName}
            {equipment.is_external_org && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-blue-50">
                      External
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Equipment from another organization</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        </div>
      </TableCell>
      <TableCell>{equipment.location || 'N/A'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/equipment/${equipment.id}/qr`}>
              <QrCode className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/equipment/${equipment.id}`}>View</Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
