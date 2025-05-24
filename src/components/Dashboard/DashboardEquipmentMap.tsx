
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Filter, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { FleetMap } from '@/components/Equipment/FleetMap/FleetMap';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { Link } from 'react-router-dom';

interface DashboardEquipmentMapProps {
  equipment: Equipment[];
  isLoading?: boolean;
}

const LOCATION_LIMIT = 15;

export function DashboardEquipmentMap({ equipment, isLoading }: DashboardEquipmentMapProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [showAllLocations, setShowAllLocations] = useState(false);

  // Filter equipment with location data and sort by freshest first
  const equipmentWithLocation = equipment.filter(item => {
    const location = getDisplayLocation(item);
    return location.hasLocation && location.coordinates;
  }).sort((a, b) => {
    // Sort by most recent location timestamp first
    const aTimestamp = a.last_scan_timestamp || a.updated_at || a.created_at;
    const bTimestamp = b.last_scan_timestamp || b.updated_at || b.created_at;
    return new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime();
  });

  // Apply limit based on toggle state
  const displayedEquipment = showAllLocations 
    ? equipmentWithLocation 
    : equipmentWithLocation.slice(0, LOCATION_LIMIT);

  const totalWithLocation = equipmentWithLocation.length;
  const isLimited = !showAllLocations && totalWithLocation > LOCATION_LIMIT;

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
            {isLimited && (
              <Badge variant="outline" className="text-xs">
                Recent Only
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isLimited 
                  ? `Showing ${displayedEquipment.length} of ${totalWithLocation} recent locations`
                  : `${totalWithLocation} of ${equipment.length} with location`
                }
              </span>
            </div>
            {totalWithLocation > LOCATION_LIMIT && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAllLocations(!showAllLocations)}
                className="flex items-center gap-2"
              >
                {showAllLocations ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Show Recent Only
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Show All Locations
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/equipment">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Equipment
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FleetMap
          equipment={displayedEquipment}
          height="500px"
          selectedEquipmentId={selectedEquipmentId}
          onEquipmentSelected={setSelectedEquipmentId}
        />

        {equipment.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No equipment found</p>
            <p className="text-sm">Add equipment to see their locations on the map</p>
          </div>
        )}

        {equipment.length > 0 && totalWithLocation === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No equipment has location data yet</p>
            <p className="text-sm">Location will be updated when equipment is scanned with GPS enabled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
