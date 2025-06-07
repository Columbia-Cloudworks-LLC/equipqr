
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

type LoadingPhase = 'idle' | 'fetching-token' | 'initializing-map' | 'loading-complete';

interface MapState {
  loadingPhase: LoadingPhase;
  token: string | null;
  error: string | null;
  retryCount: number;
}

const MAX_RETRIES = 3;
const CONTAINER_CHECK_TIMEOUT = 5000;
const MAP_LOAD_TIMEOUT = 10000;

export function FleetMap({ 
  equipment, 
  height = '400px', 
  selectedEquipmentId,
  onEquipmentSelected 
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const initializationTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [mapState, setMapState] = useState<MapState>({
    loadingPhase: 'idle',
    token: null,
    error: null,
    retryCount: 0
  });

  console.log('FleetMap: Component render', { 
    equipmentCount: equipment.length,
    mapState,
    hasContainer: !!mapContainer.current,
    hasMap: !!map.current
  });

  // Enhanced token retrieval with better error handling
  const fetchMapboxToken = useCallback(async (): Promise<string> => {
    console.log('FleetMap: Starting token fetch...');
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!sessionData?.session?.access_token) {
        throw new Error('No valid session found');
      }

      console.log('FleetMap: Session valid, calling edge function...');
      
      const { data, error: tokenError } = await supabase.functions.invoke('get_mapbox_token', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      if (tokenError) {
        throw new Error(`Token retrieval failed: ${tokenError.message}`);
      }
      
      if (!data?.token || !data.token.startsWith('pk.')) {
        throw new Error('Invalid token format received');
      }

      console.log('FleetMap: Token successfully retrieved');
      return data.token;
      
    } catch (error) {
      console.error('FleetMap: Token fetch error:', error);
      throw error;
    }
  }, []);

  // Check if container is ready for map initialization
  const isContainerReady = useCallback((): boolean => {
    const container = mapContainer.current;
    const isReady = container && 
                   container.offsetWidth > 0 && 
                   container.offsetHeight > 0 &&
                   container.getBoundingClientRect().width > 0;
    
    console.log('FleetMap: Container ready check:', {
      hasContainer: !!container,
      offsetWidth: container?.offsetWidth,
      offsetHeight: container?.offsetHeight,
      isReady
    });
    
    return isReady;
  }, []);

  // Initialize the map with the token
  const initializeMap = useCallback(async (token: string): Promise<void> => {
    console.log('FleetMap: Starting map initialization...');
    
    if (!isContainerReady()) {
      throw new Error('Container not ready for map initialization');
    }

    // Clean up existing map
    if (map.current) {
      console.log('FleetMap: Cleaning up existing map...');
      map.current.remove();
      map.current = null;
    }

    console.log('FleetMap: Setting Mapbox access token...');
    mapboxgl.accessToken = token;
    
    console.log('FleetMap: Creating map instance...');
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5, 39.8],
      zoom: 4,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('FleetMap: Map load timeout');
        reject(new Error('Map loading timeout'));
      }, MAP_LOAD_TIMEOUT);

      map.current!.on('load', () => {
        console.log('FleetMap: Map loaded successfully');
        clearTimeout(timeout);
        resolve();
      });

      map.current!.on('error', (e) => {
        console.error('FleetMap: Map error:', e);
        clearTimeout(timeout);
        reject(new Error(`Map initialization failed: ${e.error?.message || 'Unknown error'}`));
      });
    });
  }, [isContainerReady]);

  // Main initialization effect
  useEffect(() => {
    let isMounted = true;

    const initializeFleetMap = async () => {
      // Skip if already in progress or completed
      if (mapState.loadingPhase !== 'idle') {
        console.log('FleetMap: Skipping initialization, already in progress:', mapState.loadingPhase);
        return;
      }

      console.log('FleetMap: Starting initialization sequence...');
      
      try {
        // Phase 1: Fetch token
        setMapState(prev => ({ ...prev, loadingPhase: 'fetching-token', error: null }));
        
        const token = await fetchMapboxToken();
        
        if (!isMounted) return;

        console.log('FleetMap: Token retrieved, waiting for container...');
        
        // Phase 2: Wait for container and initialize map
        setMapState(prev => ({ ...prev, loadingPhase: 'initializing-map', token }));
        
        // Wait a brief moment for container to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return;

        // Check container readiness with timeout
        const containerReadyPromise = new Promise<void>((resolve, reject) => {
          const checkContainer = () => {
            if (isContainerReady()) {
              resolve();
            } else {
              setTimeout(checkContainer, 50);
            }
          };
          
          setTimeout(() => reject(new Error('Container readiness timeout')), CONTAINER_CHECK_TIMEOUT);
          checkContainer();
        });

        await containerReadyPromise;
        
        if (!isMounted) return;
        
        console.log('FleetMap: Container ready, initializing map...');
        await initializeMap(token);
        
        if (!isMounted) return;

        // Phase 3: Complete
        console.log('FleetMap: Initialization complete');
        setMapState(prev => ({ 
          ...prev, 
          loadingPhase: 'loading-complete',
          retryCount: 0 
        }));

      } catch (error) {
        console.error('FleetMap: Initialization failed:', error);
        
        if (!isMounted) return;
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
        setMapState(prev => ({ 
          ...prev, 
          loadingPhase: 'idle',
          error: errorMessage,
          retryCount: prev.retryCount + 1
        }));
      }
    };

    initializeFleetMap();

    return () => {
      isMounted = false;
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, []); // Only run once on mount

  // Equipment markers effect
  useEffect(() => {
    if (mapState.loadingPhase !== 'loading-complete' || !map.current) {
      console.log('FleetMap: Skipping marker update - map not ready', {
        loadingPhase: mapState.loadingPhase,
        hasMap: !!map.current
      });
      return;
    }

    console.log('FleetMap: Updating markers for', equipment.length, 'equipment items');

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    const equipmentWithLocation = equipment.filter(item => {
      const location = getDisplayLocation(item);
      return location.hasLocation && location.coordinates;
    });

    console.log(`FleetMap: ${equipmentWithLocation.length} items have location data`);

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
        console.log(`FleetMap: Marker clicked for equipment "${item.name}"`);
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
  }, [equipment, selectedEquipmentId, onEquipmentSelected, mapState.loadingPhase]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log('FleetMap: Component cleanup');
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
    };
  }, []);

  const handleRetry = useCallback(() => {
    console.log('FleetMap: Manual retry triggered');
    setMapState({
      loadingPhase: 'idle',
      token: null,
      error: null,
      retryCount: 0
    });
    
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  }, []);

  // Error state
  if (mapState.error) {
    console.log('FleetMap: Rendering error state:', mapState.error);
    
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <Alert className="w-full max-w-md">
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
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (mapState.loadingPhase !== 'loading-complete') {
    const getLoadingMessage = () => {
      switch (mapState.loadingPhase) {
        case 'fetching-token':
          return 'Authenticating with map services...';
        case 'initializing-map':
          return 'Initializing map...';
        default:
          return 'Preparing map...';
      }
    };

    console.log('FleetMap: Rendering loading state:', mapState.loadingPhase);
    
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{getLoadingMessage()}</p>
            <div className="text-xs text-muted-foreground mt-1">
              Phase: {mapState.loadingPhase}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('FleetMap: Rendering map container');
  
  return (
    <Card style={{ height }}>
      <CardContent className="p-0 h-full">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
