
import { Link } from 'react-router-dom';
import { Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, QrCode, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EquipmentCardProps {
  equipment: Equipment;
  showOrgInfo?: boolean;
}

export function EquipmentCard({ equipment, showOrgInfo = true }: EquipmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ensure organization name is never empty
  const orgName = equipment.org_name || 'Unknown Organization';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{equipment.name}</CardTitle>
            {showOrgInfo && equipment.team_name && (
              <div className="flex items-center mt-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                <span className="text-xs text-muted-foreground">
                  {equipment.team_name}
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
            )}
          </div>
          <Badge variant="outline" className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{equipment.model || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Serial Number</p>
            <p className="font-medium">{equipment.serial_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{equipment.location || 'Unspecified'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Organization</p>
            <p className="font-medium">{orgName}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/equipment/${equipment.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/equipment/${equipment.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/equipment/${equipment.id}/qr`}>
            <QrCode className="h-4 w-4 mr-2" />
            QR
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default EquipmentCard;
