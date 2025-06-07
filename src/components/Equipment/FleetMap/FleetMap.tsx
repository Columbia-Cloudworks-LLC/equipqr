
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FleetMapProps {
  equipment: Equipment[];
  height?: string;
  selectedEquipmentId?: string | null;
  onEquipmentSelected?: (equipmentId: string | null) => void;
}

type LoadingState = 'loading' | 'ready' | 'error';

interface MapState {
  loadingState: LoadingState;
  error: string | null;
  retryCount: number;
}

const MAX_RETRIES = 3;

export function FleetMap({ 
  equipment, 
  height = '400px', 
  selectedEquipmentId,
  onEquipmentSelected 
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const initializationAttempted = useRef(false);
  
  const [mapState, setMapState] = useState<MapState>({
    loadingState: 'loading',
    error: null,
    retryCount: 0
  });

  // Fetch Mapbox token
  const fetchMapboxToken = useCallback(async (): Promise<string> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session?.access_token) {
      throw new Error('Authentication required');
    }

    const { data, error: tokenError } = await supabase.functions.invoke('get_mapbox_token', {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    
    if (tokenError || !data?.token) {
      throw new Error('Failed to retrieve map token');
    }

    return data.token;
  }, []);

  // Initialize map with token
  const initializeMap = useCallback(async (token: string): Promise<void> => {
    if (!mapContainer.current) {
      throw new Error('Map container not available');
    }

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5, 39.8],
      zoom: 4,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Map initialization timeout'));
      }, 10000);

      map.current!.on('load', () => {
        clearTimeout(timeout);
        resolve();
      });

      map.current!.on('error', (e) => {
        clearTimeout(timeout);
        reject(new Error(`Map error: ${e.error?.message || 'Unknown error'}`));
      });
    });
  }, []);

  // Main initialization effect
  useEffect(() => {
    if (initializationAttempted.current) {
      return;
    }

    let isMounted = true;

    const initializeFleetMap = async () => {
      initializationAttempted.current = true;

      try {
        setMapState(prev => ({ ...prev, loadingState: 'loading', error: null }));
        
        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return;

        const token = await fetchMapboxToken();
        
        if (!isMounted) return;
        
        await initializeMap(token);
        
        if (!isMounted) return;

        setMapState(prev => ({ 
          ...prev, 
          loadingState: 'ready',
          retryCount: 0 
        }));

      } catch (error) {
        if (!isMounted) return;
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
        setMapState(prev => ({ 
          ...prev, 
          loadingState: 'error',
          error: errorMessage,
          retryCount: prev.retryCount + 1
        }));
      }
    };

    initializeFleetMap();

    return () => {
      isMounted = false;
    };
  }, [fetchMapboxToken, initializeMap]);

  // Equipment markers effect
  useEffect(() => {
    if (mapState.loadingState !== 'ready' || !map.current) {
      return;
    }

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    const equipmentWithLocation = equipment.filter(item => {
      const location = getDisplayLocation(item);
      return location.hasLocation && location.coordinates;
    });

    if (equipmentWithLocation.length === 0) {
      return;
    }

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

      el.addEventListener('click', () => {
        onEquipmentSelected?.(selectedEquipmentId === item.id ? null : item.id);
      });

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

    // Fit map bounds
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
  }, [equipment, selectedEquipmentId, onEquipmentSelected, mapState.loadingState]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
    };
  }, []);

  const handleRetry = useCallback(() => {
    initializationAttempted.current = false;
    setMapState({
      loadingState: 'loading',
      error: null,
      retryCount: 0
    });
    
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Trigger re-initialization
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);
  
  return (
    <Card style={{ height }}>
      <CardContent className="p-0 h-full relative">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
        
        {mapState.loadingState === 'loading' && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Initializing map...</p>
            </div>
          </div>
        )}
        
        {mapState.loadingState === 'error' && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <Alert className="w-full max-w-md mx-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <div>
                  <div className="font-medium">Map Loading Error</div>
                  <div className="text-sm text-muted-foreground mt-1">{mapState.error}</div>
                </div>
                {mapState.retryCount < MAX_RETRIES && (
                  <Button 
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Again (Attempt {mapState.retryCount + 1}/{MAX_RETRIES + 1})
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
