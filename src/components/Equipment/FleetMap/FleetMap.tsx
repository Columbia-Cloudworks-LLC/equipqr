
import React, { useEffect, useRef, useState, useCallback } from 'react';
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

interface MapState {
  token: string | null;
  isTokenLoading: boolean;
  isMapInitialized: boolean;
  error: string | null;
  retryCount: number;
}

const MAX_RETRIES = 3;
const CONTAINER_POLL_INTERVAL = 100;
const CONTAINER_POLL_TIMEOUT = 5000;

export function FleetMap({ 
  equipment, 
  height = '400px', 
  selectedEquipmentId,
  onEquipmentSelected 
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  
  const [mapState, setMapState] = useState<MapState>({
    token: null,
    isTokenLoading: false,
    isMapInitialized: false,
    error: null,
    retryCount: 0
  });

  // Token retrieval function
  const retrieveMapboxToken = useCallback(async (retryCount = 0): Promise<string | null> => {
    console.log(`FleetMap: Attempting to retrieve token (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error('No session found');
      }

      const { data, error: tokenError } = await supabase.functions.invoke('get_mapbox_token', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      if (tokenError) {
        throw new Error(`Token retrieval failed: ${tokenError.message}`);
      }
      
      if (!data?.token || data.token.length < 10 || !data.token.startsWith('pk.')) {
        throw new Error('Invalid token format received');
      }

      console.log('FleetMap: Token retrieved successfully');
      return data.token;
      
    } catch (error) {
      console.error(`FleetMap: Token retrieval error (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`FleetMap: Retrying token retrieval in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retrieveMapboxToken(retryCount + 1);
      }
      
      throw error;
    }
  }, []);

  // Container readiness polling
  const waitForContainer = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkContainer = () => {
        if (mapContainer.current && mapContainer.current.offsetWidth > 0 && mapContainer.current.offsetHeight > 0) {
          console.log('FleetMap: Container is ready');
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > CONTAINER_POLL_TIMEOUT) {
          console.warn('FleetMap: Container readiness timeout');
          resolve(false);
          return;
        }
        
        setTimeout(checkContainer, CONTAINER_POLL_INTERVAL);
      };
      
      checkContainer();
    });
  }, []);

  // Map initialization function
  const initializeMap = useCallback(async (token: string): Promise<void> => {
    console.log('FleetMap: Starting map initialization...');
    
    const isContainerReady = await waitForContainer();
    if (!isContainerReady || !mapContainer.current) {
      throw new Error('Map container not ready');
    }

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5, 39.8], // Center of US
      zoom: 4,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Set up map load promise
    return new Promise((resolve, reject) => {
      const loadTimeout = setTimeout(() => {
        reject(new Error('Map loading timeout'));
      }, 10000);

      map.current!.on('load', () => {
        console.log('FleetMap: Map loaded successfully');
        clearTimeout(loadTimeout);
        resolve();
      });

      map.current!.on('error', (e) => {
        console.error('FleetMap: Map error:', e);
        clearTimeout(loadTimeout);
        reject(new Error('Map failed to load'));
      });
    });
  }, [waitForContainer]);

  // Token retrieval effect
  useEffect(() => {
    let isMounted = true;
    
    const fetchToken = async () => {
      if (mapState.token || mapState.isTokenLoading) {
        return;
      }
      
      setMapState(prev => ({ ...prev, isTokenLoading: true, error: null }));
      
      try {
        const token = await retrieveMapboxToken();
        if (isMounted && token) {
          setMapState(prev => ({ 
            ...prev, 
            token, 
            isTokenLoading: false,
            retryCount: 0
          }));
        }
      } catch (error) {
        console.error('FleetMap: Failed to retrieve token:', error);
        if (isMounted) {
          setMapState(prev => ({ 
            ...prev, 
            error: error instanceof Error ? error.message : 'Failed to load map configuration',
            isTokenLoading: false,
            retryCount: prev.retryCount + 1
          }));
        }
      }
    };

    fetchToken();
    
    return () => {
      isMounted = false;
    };
  }, [retrieveMapboxToken, mapState.token, mapState.isTokenLoading]);

  // Map initialization effect
  useEffect(() => {
    let isMounted = true;
    
    const setupMap = async () => {
      if (!mapState.token || mapState.isMapInitialized || map.current) {
        return;
      }
      
      try {
        setMapState(prev => ({ ...prev, error: null }));
        await initializeMap(mapState.token);
        
        if (isMounted) {
          setMapState(prev => ({ ...prev, isMapInitialized: true }));
        }
      } catch (error) {
        console.error('FleetMap: Map initialization failed:', error);
        if (isMounted) {
          setMapState(prev => ({ 
            ...prev, 
            error: error instanceof Error ? error.message : 'Failed to initialize map'
          }));
        }
      }
    };

    setupMap();
    
    return () => {
      isMounted = false;
      if (map.current) {
        console.log('FleetMap: Cleaning up map instance');
        map.current.remove();
        map.current = null;
        setMapState(prev => ({ ...prev, isMapInitialized: false }));
      }
    };
  }, [mapState.token, mapState.isMapInitialized, initializeMap]);

  // Equipment markers effect
  useEffect(() => {
    if (!map.current || !mapState.isMapInitialized || mapState.error) {
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

    if (equipmentWithLocation.length === 0) {
      console.log('FleetMap: No equipment with location data');
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
  }, [equipment, selectedEquipmentId, onEquipmentSelected, mapState.isMapInitialized, mapState.error]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setMapState({
      token: null,
      isTokenLoading: false,
      isMapInitialized: false,
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
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <Alert className="w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>{mapState.error}</div>
              {mapState.retryCount < MAX_RETRIES && (
                <button 
                  onClick={handleRetry}
                  className="text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (mapState.isTokenLoading || !mapState.isMapInitialized) {
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {mapState.isTokenLoading ? 'Authenticating...' : 'Loading map...'}
            </p>
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
