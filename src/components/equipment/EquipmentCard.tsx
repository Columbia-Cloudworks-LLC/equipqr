import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, MapPin, Calendar, Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getStatusColor } from '@/utils/equipmentHelpers';

interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: string;
  location: string;
  lastMaintenance?: string;
  image_url?: string;
}

interface EquipmentCardProps {
  equipment: Equipment;
  onShowQRCode: (id: string) => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onShowQRCode
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{equipment.name}</CardTitle>
            <CardDescription>
              {equipment.manufacturer} {equipment.model}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equipment Image */}
        <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
          {equipment.image_url ? (
            <img
              src={equipment.image_url}
              alt={`${equipment.name} equipment`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = `https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop&crop=center`;
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Serial:</span>
            <span className="text-muted-foreground">{equipment.serialNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{equipment.location}</span>
          </div>
          {equipment.lastMaintenance && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Last maintenance: {new Date(equipment.lastMaintenance).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        <div className={isMobile ? "space-y-2" : "flex gap-2"}>
          <Button 
            variant="outline" 
            size="sm" 
            className={isMobile ? "w-full" : "flex-1"}
            onClick={() => onShowQRCode(equipment.id)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={isMobile ? "w-full" : "flex-1"}
            onClick={() => navigate(`/equipment/${equipment.id}`)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentCard;