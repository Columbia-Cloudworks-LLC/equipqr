
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, MapPin } from 'lucide-react';
import { FleetMap } from '@/components/Equipment/FleetMap/FleetMap';
import { FleetMapSidebar } from './FleetMapSidebar';
import { Equipment } from '@/types';
import { Link } from 'react-router-dom';

interface FleetMapContentProps {
  isLoading: boolean;
  filteredEquipment: Equipment[];
  equipmentWithLocation: Equipment[];
  selectedEquipmentId: string | null;
  onEquipmentSelected: (equipmentId: string | null) => void;
  selectedEquipment: Equipment | null;
}

export function FleetMapContent({
  isLoading,
  filteredEquipment,
  equipmentWithLocation,
  selectedEquipmentId,
  onEquipmentSelected,
  selectedEquipment
}: FleetMapContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      {/* Map */}
      <div className="xl:col-span-3">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading fleet map...</p>
                </div>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Equipment Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add equipment to see their locations on the map
                  </p>
                  <Button asChild>
                    <Link to="/equipment/new">Add Equipment</Link>
                  </Button>
                </div>
              </div>
            ) : equipmentWithLocation.length === 0 ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Location Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Equipment locations will appear here when they are scanned with GPS enabled
                  </p>
                </div>
              </div>
            ) : (
              <FleetMap
                equipment={filteredEquipment}
                height="600px"
                selectedEquipmentId={selectedEquipmentId}
                onEquipmentSelected={onEquipmentSelected}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Equipment Details Sidebar */}
      <div className="xl:col-span-1">
        <FleetMapSidebar selectedEquipment={selectedEquipment} />
      </div>
    </div>
  );
}
