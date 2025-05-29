
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Filter, ExternalLink, Eye, EyeOff, Lock } from 'lucide-react';
import { FleetMap } from '@/components/Equipment/FleetMap/FleetMap';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { Link } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface DashboardEquipmentMapProps {
  equipment: Equipment[];
  isLoading?: boolean;
}

const LOCATION_LIMIT = 15;

export function DashboardEquipmentMap({ equipment, isLoading }: DashboardEquipmentMapProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess('fleet_map');

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

  if (isLoading || accessLoading) {
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

  // Show locked state if no access
  if (!hasAccess) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Fleet Map
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Lock className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/equipment">
                <ExternalLink className="h-4 w-4 mr-2" />
                Unlock Fleet Map
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-300">
                <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fleet Map Premium Feature</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-md">
                  Upgrade to unlock interactive maps showing real-time equipment locations across your fleet.
                </p>
                <Button asChild>
                  <Link to="/fleet-map">
                    View Upgrade Options
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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
              <Link to="/fleet-map">
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Fleet Map
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
