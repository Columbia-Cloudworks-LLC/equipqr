
import { Link } from 'react-router-dom';
import { Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, QrCode } from 'lucide-react';

interface EquipmentCardProps {
  equipment: Equipment;
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'In Use': return 'bg-blue-100 text-blue-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{equipment.name}</CardTitle>
          <Badge variant="outline" className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{equipment.model}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Serial Number</p>
            <p className="font-medium">{equipment.serialNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{equipment.location}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Assigned To</p>
            <p className="font-medium">{equipment.assignedTo || 'Unassigned'}</p>
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
