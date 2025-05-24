
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';

interface FleetMapProps {
  equipment: Equipment[];
  height?: string;
  selectedEquipmentId?: string | null;
  onEquipmentSelected?: (equipmentId: string | null) => void;
  teamId?: string;
}

export function FleetMap({ 
  equipment, 
  height = '500px', 
  selectedEquipmentId, 
  onEquipmentSelected,
  teamId 
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter equipment that has location data
  const equipmentWithLocation = equipment.filter(item => {
    const location = getDisplayLocation(item);
    return location.hasLocation && location.coordinates;
  });

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.functions.invoke('get_mapbox_token', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setError('Failed to load map configuration');
          return;
        }

        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setError('Map configuration not available');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError('Failed to load map configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || equipmentWithLocation.length === 0) {
      return;
    }

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      zoom: 2,
      center: [0, 0],
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();

      // Add markers for each equipment location
      const bounds = new mapboxgl.LngLatBounds();
      
      equipmentWithLocation.forEach((item) => {
        const location = getDisplayLocation(item);
        if (!location.coordinates) return;

        const coords: [number, number] = [location.coordinates.lng, location.coordinates.lat];
        bounds.extend(coords);

        // Create marker color based on equipment status
        const getMarkerColor = (status: string) => {
          switch (status.toLowerCase()) {
            case 'active': return '#22c55e';
            case 'maintenance': return '#f59e0b';
            case 'retired': return '#6b7280';
            default: return '#3b82f6';
          }
        };

        const markerColor = getMarkerColor(item.status);
        const isSelected = selectedEquipmentId === item.id;

        // Create custom marker
        const marker = new mapboxgl.Marker({ 
          color: markerColor,
          scale: isSelected ? 1.2 : 1.0
        }).setLngLat(coords);

        // Create popup content
        const popupContent = `
          <div class="p-3 max-w-xs">
            <div class="font-medium mb-2">${item.name}</div>
            <div class="text-sm space-y-1">
              <div><strong>Status:</strong> ${item.status}</div>
              <div><strong>Team:</strong> ${item.team_name || 'Unassigned'}</div>
              ${item.manufacturer ? `<div><strong>Manufacturer:</strong> ${item.manufacturer}</div>` : ''}
              ${item.model ? `<div><strong>Model:</strong> ${item.model}</div>` : ''}
              ${location.source === 'scan' && location.accuracy ? 
                `<div class="text-xs text-gray-600">Accuracy: ±${Math.round(location.accuracy)}m</div>` : ''
              }
              ${location.timestamp ? 
                `<div class="text-xs text-gray-600">Last updated: ${new Date(location.timestamp).toLocaleDateString()}</div>` : ''
              }
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);

        marker.setPopup(popup);
        marker.addTo(map.current!);
        
        // Store marker reference
        markers.current.set(item.id, marker);

        // Add click handler
        marker.getElement().addEventListener('click', () => {
          onEquipmentSelected?.(item.id);
        });
      });

      // Fit map to show all markers
      if (equipmentWithLocation.length === 1) {
        const location = getDisplayLocation(equipmentWithLocation[0]);
        if (location.coordinates) {
          map.current.setCenter([location.coordinates.lng, location.coordinates.lat]);
          map.current.setZoom(15);
        }
      } else if (equipmentWithLocation.length > 1) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();
      map.current?.remove();
    };
  }, [mapboxToken, equipmentWithLocation, selectedEquipmentId, onEquipmentSelected]);

  // Update marker highlighting when selection changes
  useEffect(() => {
    markers.current.forEach((marker, equipmentId) => {
      const isSelected = selectedEquipmentId === equipmentId;
      marker.getElement().style.transform = `scale(${isSelected ? 1.2 : 1.0})`;
    });
  }, [selectedEquipmentId]);

  // If no equipment with location, return null to let parent handle empty state
  if (equipmentWithLocation.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
            {teamId && <Badge variant="outline">Team View</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <h3 className="font-medium mb-1">Loading Map</h3>
          <p className="text-sm text-muted-foreground">
            Initializing map configuration...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
            {teamId && <Badge variant="outline">Team View</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <h3 className="font-medium mb-1 text-red-600">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Fleet Map
          {teamId && <Badge variant="outline">Team View</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          style={{ height }}
          className="w-full"
        />
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {equipmentWithLocation.length} of {equipment.length} equipment with location data
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Maintenance</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-xs">Retired</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
