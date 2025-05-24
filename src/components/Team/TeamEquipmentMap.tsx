
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Filter } from 'lucide-react';
import { FleetMap } from '@/components/Equipment/FleetMap/FleetMap';
import { Equipment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayLocation } from '@/services/equipment/locationService';

interface TeamEquipmentMapProps {
  teamId: string;
  teamName: string;
}

export function TeamEquipmentMap({ teamId, teamName }: TeamEquipmentMapProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  // Fetch team equipment with location data
  useEffect(() => {
    const fetchTeamEquipment = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('equipment')
          .select(`
            *,
            team:team_id (name),
            org:org_id (name)
          `)
          .eq('team_id', teamId)
          .is('deleted_at', null);

        if (error) {
          console.error('Error fetching team equipment:', error);
          return;
        }

        const equipmentWithLocation = data?.map(item => ({
          ...item,
          team_name: item.team?.name || null,
          org_name: item.org?.name || 'Unknown Organization'
        })) || [];

        setEquipment(equipmentWithLocation);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamEquipment();
  }, [teamId]);

  const equipmentWithLocationCount = equipment.filter(item => {
    const location = getDisplayLocation(item);
    return location.hasLocation && location.coordinates;
  }).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Equipment Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Equipment Locations
            <Badge variant="outline">{teamName}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {equipmentWithLocationCount} of {equipment.length} with location
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fleet Map */}
        <FleetMap
          equipment={equipment}
          height="400px"
          selectedEquipmentId={selectedEquipmentId}
          onEquipmentSelected={setSelectedEquipmentId}
          teamId={teamId}
        />

        {equipment.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No equipment found for this team</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
