
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin } from 'lucide-react';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { Link } from 'react-router-dom';

interface FleetMapSidebarProps {
  selectedEquipment: Equipment | null;
}

export function FleetMapSidebar({ selectedEquipment }: FleetMapSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Equipment Details</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedEquipment ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-base mb-2">{selectedEquipment.name}</h3>
              <Badge variant="outline">{selectedEquipment.status}</Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Team:</span>
                <p className="text-muted-foreground">{selectedEquipment.team_name || 'Unassigned'}</p>
              </div>
              
              {selectedEquipment.manufacturer && (
                <div>
                  <span className="font-medium">Manufacturer:</span>
                  <p className="text-muted-foreground">{selectedEquipment.manufacturer}</p>
                </div>
              )}
              
              {selectedEquipment.model && (
                <div>
                  <span className="font-medium">Model:</span>
                  <p className="text-muted-foreground">{selectedEquipment.model}</p>
                </div>
              )}
              
              <div>
                <span className="font-medium">Location:</span>
                <p className="text-muted-foreground">
                  {(() => {
                    const location = getDisplayLocation(selectedEquipment);
                    return location.displayText;
                  })()}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <Button asChild className="w-full" size="sm">
              <Link to={`/equipment/${selectedEquipment.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click on a map marker to view equipment details
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
