
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Settings, Target, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Equipment } from '@/types';

interface LocationDisplayProps {
  equipment: Equipment;
  onViewOnMap?: () => void;
  onToggleOverride?: () => void;
  canEdit?: boolean;
  isUpdating?: boolean;
}

export function LocationDisplay({ 
  equipment, 
  onViewOnMap, 
  onToggleOverride, 
  canEdit = false,
  isUpdating = false
}: LocationDisplayProps) {
  const hasLastScanLocation = equipment.last_scan_latitude && equipment.last_scan_longitude;
  const hasManualLocation = equipment.location;
  const isLocationOverride = equipment.location_override;
  const locationSource = equipment.location_source || 'manual';

  if (!hasLastScanLocation && !hasManualLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No location data available</p>
            <p className="text-sm">Location will be updated when equipment is scanned with GPS enabled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Location */}
        {hasManualLocation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Manual Location</span>
              </div>
              <Badge variant="outline">Manual</Badge>
            </div>
            <p className="text-sm pl-6">{equipment.location}</p>
          </div>
        )}

        {/* Last Scan Location */}
        {hasLastScanLocation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Last Known Location</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={locationSource === 'scan' ? 'default' : 'secondary'}>
                  {locationSource === 'scan' ? 'GPS Tracked' : 'Manual'}
                </Badge>
                {isLocationOverride && (
                  <Badge variant="outline">Override Active</Badge>
                )}
              </div>
            </div>
            
            <div className="pl-6 space-y-2">
              <div className="text-sm">
                <button
                  onClick={onViewOnMap}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
                >
                  {equipment.last_scan_latitude?.toFixed(6)}, {equipment.last_scan_longitude?.toFixed(6)}
                </button>
              </div>
              
              {equipment.last_scan_accuracy && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>Accuracy: ±{Math.round(equipment.last_scan_accuracy)}m</span>
                </div>
              )}
              
              {equipment.last_scan_timestamp && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Last updated {formatDistanceToNow(new Date(equipment.last_scan_timestamp), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Controls */}
        {canEdit && hasLastScanLocation && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex gap-2">
              {onViewOnMap && (
                <Button onClick={onViewOnMap} variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
              )}
              {onToggleOverride && (
                <Button 
                  onClick={onToggleOverride} 
                  variant="outline" 
                  size="sm"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  {isLocationOverride ? 'Resume Auto Tracking' : 'Override Location'}
                </Button>
              )}
            </div>
            {!isLocationOverride && (
              <p className="text-xs text-muted-foreground">
                Location automatically updates from GPS scans
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
