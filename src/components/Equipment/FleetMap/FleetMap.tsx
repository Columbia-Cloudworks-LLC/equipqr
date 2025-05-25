
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Get Mapbox token from edge function
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get_mapbox_token');
        
        if (error) {
          console.warn('Failed to get Mapbox token from edge function:', error);
          setError('Map service is not configured. Please contact your administrator.');
          setIsLoading(false);
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setError('Map service is not available.');
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error calling Mapbox token function:', err);
        setError('Map service is temporarily unavailable.');
        setIsLoading(false);
      }
    };

    getMapboxToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-98.5, 39.8], // Center of US
        zoom: 4,
        projection: 'mercator'
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setIsLoading(false);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map. Please try refreshing the page.');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please try refreshing the page.');
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update markers when equipment changes
  useEffect(() => {
    if (!map.current || isLoading || error) return;

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Filter equipment with valid location data
    const equipmentWithLocation = equipment.filter(item => {
      const location = getDisplayLocation(item);
      return location.hasLocation && location.coordinates;
    });

    if (equipmentWithLocation.length === 0) return;

    // Add new markers
    equipmentWithLocation.forEach(item => {
      const location = getDisplayLocation(item);
      if (!location.coordinates) return;

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
      const bounds = new mapboxgl.LngLatBounds();
      equipmentWithLocation.forEach(item => {
        const location = getDisplayLocation(item);
        if (location.coordinates) {
          bounds.extend([location.coordinates.lng, location.coordinates.lat]);
        }
      });
      
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [equipment, selectedEquipmentId, onEquipmentSelected, isLoading, error]);

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

  if (isLoading) {
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
