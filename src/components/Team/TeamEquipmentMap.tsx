
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface LocationFilter {
  country?: string;
  state?: string;
  city?: string;
}

interface GeographicOptions {
  countries: string[];
  states: string[];
  cities: string[];
}

export function TeamEquipmentMap({ teamId, teamName }: TeamEquipmentMapProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({});
  const [geoOptions, setGeoOptions] = useState<GeographicOptions>({
    countries: [],
    states: [],
    cities: []
  });

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
        
        // Extract geographic options from location data
        extractGeographicOptions(equipmentWithLocation);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamEquipment();
  }, [teamId]);

  // Extract geographic data for filtering
  const extractGeographicOptions = (equipmentList: Equipment[]) => {
    const countries = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();

    equipmentList.forEach(item => {
      const location = getDisplayLocation(item);
      if (location.hasLocation && item.location) {
        // Parse manual location for geographic components
        // This is a simple parser - in a real app you might want to use a geocoding service
        const locationParts = item.location.split(',').map(part => part.trim());
        
        if (locationParts.length >= 1) cities.add(locationParts[0]);
        if (locationParts.length >= 2) states.add(locationParts[1]);
        if (locationParts.length >= 3) countries.add(locationParts[2]);
      }
    });

    setGeoOptions({
      countries: Array.from(countries).sort(),
      states: Array.from(states).sort(),
      cities: Array.from(cities).sort()
    });
  };

  // Filter equipment based on geographic filters
  useEffect(() => {
    let filtered = equipment;

    if (locationFilter.country || locationFilter.state || locationFilter.city) {
      filtered = equipment.filter(item => {
        if (!item.location) return false;
        
        const locationParts = item.location.split(',').map(part => part.trim());
        const [city, state, country] = locationParts;

        return (
          (!locationFilter.city || city === locationFilter.city) &&
          (!locationFilter.state || state === locationFilter.state) &&
          (!locationFilter.country || country === locationFilter.country)
        );
      });
    }

    setFilteredEquipment(filtered);
  }, [equipment, locationFilter]);

  const equipmentWithLocationCount = filteredEquipment.filter(item => {
    const location = getDisplayLocation(item);
    return location.hasLocation && location.coordinates;
  }).length;

  const clearFilters = () => {
    setLocationFilter({});
  };

  const hasActiveFilters = locationFilter.country || locationFilter.state || locationFilter.city;

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
              {equipmentWithLocationCount} of {filteredEquipment.length} with location
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Geographic Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={locationFilter.country || ''}
            onValueChange={(value) => setLocationFilter(prev => ({ ...prev, country: value || undefined }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {geoOptions.countries.map(country => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={locationFilter.state || ''}
            onValueChange={(value) => setLocationFilter(prev => ({ ...prev, state: value || undefined }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {geoOptions.states.map(state => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={locationFilter.city || ''}
            onValueChange={(value) => setLocationFilter(prev => ({ ...prev, city: value || undefined }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {geoOptions.cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground border rounded-md hover:bg-muted"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Fleet Map */}
        <FleetMap
          equipment={filteredEquipment}
          height="400px"
          selectedEquipmentId={selectedEquipmentId}
          onEquipmentSelected={setSelectedEquipmentId}
          teamId={teamId}
        />

        {filteredEquipment.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No equipment found with the selected filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
