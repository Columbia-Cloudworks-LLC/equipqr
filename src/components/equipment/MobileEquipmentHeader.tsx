import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, QrCode, MapPin, Calendar, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Equipment = Tables<'equipment'>;

interface MobileEquipmentHeaderProps {
  equipment: Equipment;
  onShowQRCode: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}

const MobileEquipmentHeader: React.FC<MobileEquipmentHeaderProps> = ({
  equipment,
  onShowQRCode,
  canDelete = false,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/dashboard/equipment')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onShowQRCode}>
            <QrCode className="h-4 w-4" />
          </Button>
          {canDelete && onDelete && (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Equipment Title and Status */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold leading-tight">{equipment.name}</h1>
          <Badge className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {equipment.manufacturer} {equipment.model}
        </p>
        <p className="text-sm text-muted-foreground">
          S/N: {equipment.serial_number}
        </p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-muted-foreground truncate">{equipment.location}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Last Maintenance</p>
            <p className="text-sm text-muted-foreground">
              {equipment.last_maintenance ? 
                new Date(equipment.last_maintenance).toLocaleDateString() : 
                'Not recorded'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileEquipmentHeader;