
import { Equipment } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Package, QrCode, Building, MapPin, ImageIcon } from 'lucide-react';
import { truncateText } from '@/utils/textUtils';
import { useQuery } from '@tanstack/react-query';
import { getEquipmentLatestImage } from '@/services/equipment/imageService';

interface EquipmentCardProps {
  equipment: Equipment;
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'storage': return 'bg-blue-100 text-blue-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the latest image for this equipment
  const { data: latestImage } = useQuery({
    queryKey: ['equipmentLatestImage', equipment.id],
    queryFn: () => getEquipmentLatestImage(equipment.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight mr-2">
            {truncateText(equipment.name, 50)}
          </CardTitle>
          <Badge variant="outline" className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        {/* Image thumbnail */}
        {latestImage ? (
          <div className="mb-3">
            <img
              src={latestImage}
              alt={`${equipment.name} latest image`}
              className="w-full h-32 object-cover rounded border"
            />
          </div>
        ) : (
          <div className="mb-3 w-full h-32 bg-muted rounded border flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <dl className="space-y-2 text-sm">
          {equipment.model && (
            <div className="flex items-start">
              <dt className="w-5 mr-2 flex-shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </dt>
              <dd className="flex-1 break-words">{equipment.model}</dd>
            </div>
          )}
          
          {equipment.serial_number && (
            <div className="flex items-start">
              <dt className="w-5 mr-2 flex-shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">#</span>
              </dt>
              <dd className="flex-1 break-all">{equipment.serial_number}</dd>
            </div>
          )}
          
          {equipment.team_name && (
            <div className="flex items-start">
              <dt className="w-5 mr-2 flex-shrink-0">
                <Users className="h-4 w-4 text-muted-foreground" />
              </dt>
              <dd className="flex-1">{truncateText(equipment.team_name, 25)}</dd>
            </div>
          )}
          
          {equipment.org_name && (
            <div className="flex items-start">
              <dt className="w-5 mr-2 flex-shrink-0">
                <Building className="h-4 w-4 text-muted-foreground" />
              </dt>
              <dd className="flex-1">{truncateText(equipment.org_name, 25)}</dd>
            </div>
          )}
          
          {equipment.location && (
            <div className="flex items-start">
              <dt className="w-5 mr-2 flex-shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </dt>
              <dd className="flex-1">{truncateText(equipment.location, 30)}</dd>
            </div>
          )}
        </dl>
      </CardContent>
      
      <CardFooter className="pt-2 gap-2 flex flex-wrap">
        <Button size="sm" variant="outline" className="flex-1" asChild>
          <Link to={`/equipment/${equipment.id}`}>
            Details
          </Link>
        </Button>
        
        <Button size="sm" variant="ghost" className="px-2" asChild>
          <Link to={`/equipment/${equipment.id}/qr`}>
            <QrCode className="h-4 w-4" />
            <span className="sr-only">QR Code</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
