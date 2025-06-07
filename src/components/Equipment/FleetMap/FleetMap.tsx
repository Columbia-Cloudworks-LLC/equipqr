
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface FleetMapProps {
  equipment: Equipment[];
  height?: string;
  selectedEquipmentId?: string | null;
  onEquipmentSelected?: (equipmentId: string | null) => void;
}

export function FleetMap({ 
  equipment, 
  height = '400px', 
  selectedEquipmentId,
  onEquipmentSelected 
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [error, setError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Combined token retrieval and map initialization
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      if (!mapContainer.current) {
        console.log('FleetMap: Container not ready, skipping initialization');
        return;
      }

      console.log('FleetMap: Starting map initialization process...');
      
      try {
        setError(null);
        
        console.log('FleetMap: Getting session for authorization...');
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session?.access_token) {
          console.error('FleetMap: No session found');
          if (isMounted) {
            setError('Authentication required. Please sign in again.');
          }
          return;
        }

        console.log('FleetMap: Calling get_mapbox_token edge function...');
        const { data, error: tokenError } = await supabase.functions.invoke('get_mapbox_token', {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });
        
        if (tokenError) {
          console.error('FleetMap: Edge function error:', tokenError);
          if (isMounted) {
            setError('Failed to load map configuration');
          }
          return;
        }
        
        if (!data?.token) {
          console.error('FleetMap: No token in response');
          if (isMounted) {
            setError('Map configuration not available');
          }
          return;
        }

        // Validate token format
        if (data.token.length < 10 || !data.token.startsWith('pk.')) {
          console.error('FleetMap: Invalid token format');
          if (isMounted) {
            setError('Invalid map configuration.');
          }
          return;
        }

        console.log('FleetMap: Token received, initializing map...');
        
        // Check if container is still available and component is mounted
        if (!isMounted || !mapContainer.current) {
          console.log('FleetMap: Component unmounted or container unavailable during initialization');
          return;
        }

        mapboxgl.accessToken = data.token;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-98.5, 39.8], // Center of US
          zoom: 4,
          projection: 'mercator'
        });

        console.log('FleetMap: Map instance created');

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Set timeout for loading detection
        const loadTimeout = setTimeout(() => {
          if (isMounted) {
            console.error('FleetMap: Map loading timeout after 10 seconds');
            setError('Map is taking too long to load. Please try refreshing the page.');
          }
        }, 10000);

        map.current.on('load', () => {
          console.log('FleetMap: Map loaded successfully');
          clearTimeout(loadTimeout);
          if (isMounted) {
            setMapInitialized(true);
            setError(null);
          }
        });

        map.current.on('error', (e) => {
          console.error('FleetMap: Map error event:', e);
          clearTimeout(loadTimeout);
          if (isMounted) {
            setError('Failed to load map. Please try refreshing the page.');
          }
        });

        // Additional debugging events
        map.current.on('style.load', () => {
          console.log('FleetMap: Map style loaded');
        });

        map.current.on('sourcedata', (e) => {
          if (e.isSourceLoaded) {
            console.log('FleetMap: Source data loaded:', e.sourceId);
          }
        });

      } catch (err) {
        console.error('FleetMap: Exception during map initialization:', err);
        if (isMounted) {
          setError('Failed to initialize map. Please try refreshing the page.');
        }
      }
    };

    initializeMap();

    return () => {
      console.log('FleetMap: Cleaning up map instance');
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapInitialized(false);
    };
  }, []); // Only run once on mount

  // Update markers when equipment changes or map is ready
  useEffect(() => {
    if (!map.current || !mapInitialized || error) {
      console.log('FleetMap: Skipping marker update - map ready:', mapInitialized, 'error:', !!error);
      return;
    }

    console.log('FleetMap: Updating markers for', equipment.length, 'equipment items');

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Filter equipment with valid location data
    const equipmentWithLocation = equipment.filter(item => {
      const location = getDisplayLocation(item);
      return location.hasLocation && location.coordinates;
    });

    console.log('FleetMap: Found', equipmentWithLocation.length, 'equipment items with location');

    if (equipmentWithLocation.length === 0) {
      console.log('FleetMap: No equipment with location data, map will remain empty');
      return;
    }

    // Add new markers
    equipmentWithLocation.forEach(item => {
      const location = getDisplayLocation(item);
      if (!location.coordinates) return;

      console.log('FleetMap: Adding marker for equipment:', item.name, 'at', location.coordinates);

      const el = document.createElement('div');
      el.className = `w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all hover:scale-110 ${
        selectedEquipmentId === item.id ? 'bg-blue-600' : 
        item.status === 'active' ? 'bg-green-500' :
        item.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
      }`;
      
      el.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold">${item.name.charAt(0)}</div>`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .addTo(map.current!);

      // Add click handler
      el.addEventListener('click', () => {
        if (onEquipmentSelected) {
          onEquipmentSelected(selectedEquipmentId === item.id ? null : item.id);
        }
      });

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${item.name}</h3>
            <p class="text-sm text-gray-600">Status: ${item.status}</p>
            ${item.team_name ? `<p class="text-sm text-gray-600">Team: ${item.team_name}</p>` : ''}
            <p class="text-sm text-gray-500">${location.displayText}</p>
          </div>
        `);

      marker.setPopup(popup);
      markers.current[item.id] = marker;
    });

    // Fit map to show all markers
    if (equipmentWithLocation.length > 0) {
      console.log('FleetMap: Fitting map bounds to show all markers');
      const bounds = new mapboxgl.LngLatBounds();
      equipmentWithLocation.forEach(item => {
        const location = getDisplayLocation(item);
        if (location.coordinates) {
          bounds.extend([location.coordinates.lng, location.coordinates.lat]);
        }
      });
      
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [equipment, selectedEquipmentId, onEquipmentSelected, mapInitialized, error]);

  if (error) {
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <Alert className="w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!mapInitialized) {
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ height }}>
      <CardContent className="p-0 h-full">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
