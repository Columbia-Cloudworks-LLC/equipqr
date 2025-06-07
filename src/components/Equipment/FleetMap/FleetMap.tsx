
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

interface MapState {
  token: string | null;
  isTokenLoading: boolean;
  isMapInitialized: boolean;
  error: string | null;
  retryCount: number;
  lastErrorType: 'auth' | 'map' | 'container' | 'network' | null;
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
    retryCount: 0,
    lastErrorType: null
  });

  console.log('FleetMap: Rendering with', equipment.length, 'equipment items');
  console.log('FleetMap: Current map state:', mapState);

  // Enhanced token retrieval function with detailed logging
  const retrieveMapboxToken = useCallback(async (retryCount = 0): Promise<string | null> => {
    console.log(`FleetMap: Attempting to retrieve token (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    try {
      // Check session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('FleetMap: Session check result:', { 
        hasSession: !!sessionData?.session, 
        hasUser: !!sessionData?.session?.user,
        hasAccessToken: !!sessionData?.session?.access_token,
        error: sessionError
      });
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!sessionData?.session?.access_token) {
        throw new Error('No valid session or access token found');
      }

      console.log('FleetMap: Calling get_mapbox_token edge function...');
      const { data, error: tokenError } = await supabase.functions.invoke('get_mapbox_token', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      console.log('FleetMap: Edge function response:', { data, error: tokenError });
      
      if (tokenError) {
        throw new Error(`Token retrieval failed: ${tokenError.message}`);
      }
      
      if (!data?.token || data.token.length < 10 || !data.token.startsWith('pk.')) {
        throw new Error(`Invalid token format received: ${data?.token ? 'token exists but invalid format' : 'no token'}`);
      }

      console.log('FleetMap: Token retrieved successfully, length:', data.token.length);
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

  // Enhanced container readiness polling
  const waitForContainer = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let attempts = 0;
      
      const checkContainer = () => {
        attempts++;
        
        if (mapContainer.current && mapContainer.current.offsetWidth > 0 && mapContainer.current.offsetHeight > 0) {
          console.log(`FleetMap: Container is ready after ${attempts} attempts`);
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > CONTAINER_POLL_TIMEOUT) {
          console.warn(`FleetMap: Container readiness timeout after ${attempts} attempts`);
          resolve(false);
          return;
        }
        
        setTimeout(checkContainer, CONTAINER_POLL_INTERVAL);
      };
      
      checkContainer();
    });
  }, []);

  // Enhanced map initialization function
  const initializeMap = useCallback(async (token: string): Promise<void> => {
    console.log('FleetMap: Starting map initialization...');
    
    const isContainerReady = await waitForContainer();
    if (!isContainerReady || !mapContainer.current) {
      throw new Error('Map container not ready after timeout');
    }

    console.log('FleetMap: Setting Mapbox access token...');
    mapboxgl.accessToken = token;
    
    console.log('FleetMap: Creating map instance...');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5, 39.8], // Center of US
      zoom: 4,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Set up map load promise with enhanced error handling
    return new Promise((resolve, reject) => {
      const loadTimeout = setTimeout(() => {
        console.error('FleetMap: Map loading timeout');
        reject(new Error('Map loading timeout after 10 seconds'));
      }, 10000);

      map.current!.on('load', () => {
        console.log('FleetMap: Map loaded successfully');
        clearTimeout(loadTimeout);
        resolve();
      });

      map.current!.on('error', (e) => {
        console.error('FleetMap: Map error during initialization:', e);
        clearTimeout(loadTimeout);
        reject(new Error(`Map failed to load: ${e.error?.message || 'Unknown error'}`));
      });
    });
  }, [waitForContainer]);

  // Enhanced token retrieval effect
  useEffect(() => {
    let isMounted = true;
    
    const fetchToken = async () => {
      if (mapState.token || mapState.isTokenLoading) {
        console.log('FleetMap: Skipping token fetch - already have token or loading');
        return;
      }
      
      console.log('FleetMap: Starting token fetch...');
      setMapState(prev => ({ ...prev, isTokenLoading: true, error: null, lastErrorType: null }));
      
      try {
        const token = await retrieveMapboxToken();
        if (isMounted && token) {
          console.log('FleetMap: Token successfully retrieved and component still mounted');
          setMapState(prev => ({ 
            ...prev, 
            token, 
            isTokenLoading: false,
            retryCount: 0,
            error: null,
            lastErrorType: null
          }));
        }
      } catch (error) {
        console.error('FleetMap: Failed to retrieve token:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load map configuration';
          setMapState(prev => ({ 
            ...prev, 
            error: errorMessage,
            isTokenLoading: false,
            retryCount: prev.retryCount + 1,
            lastErrorType: errorMessage.includes('Session') || errorMessage.includes('access token') ? 'auth' : 'network'
          }));
        }
      }
    };

    fetchToken();
    
    return () => {
      isMounted = false;
    };
  }, [retrieveMapboxToken, mapState.token, mapState.isTokenLoading]);

  // Enhanced map initialization effect
  useEffect(() => {
    let isMounted = true;
    
    const setupMap = async () => {
      if (!mapState.token || mapState.isMapInitialized || map.current) {
        console.log('FleetMap: Skipping map setup - conditions not met', {
          hasToken: !!mapState.token,
          isInitialized: mapState.isMapInitialized,
          hasMapInstance: !!map.current
        });
        return;
      }
      
      console.log('FleetMap: Starting map setup...');
      
      try {
        setMapState(prev => ({ ...prev, error: null, lastErrorType: null }));
        await initializeMap(mapState.token);
        
        if (isMounted) {
          console.log('FleetMap: Map initialization completed successfully');
          setMapState(prev => ({ ...prev, isMapInitialized: true }));
        }
      } catch (error) {
        console.error('FleetMap: Map initialization failed:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
          setMapState(prev => ({ 
            ...prev, 
            error: errorMessage,
            lastErrorType: errorMessage.includes('container') ? 'container' : 'map'
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

  // Enhanced equipment markers effect with better logging
  useEffect(() => {
    if (!map.current || !mapState.isMapInitialized || mapState.error) {
      console.log('FleetMap: Skipping marker update - map not ready', {
        hasMap: !!map.current,
        isInitialized: mapState.isMapInitialized,
        hasError: !!mapState.error
      });
      return;
    }

    console.log('FleetMap: Updating markers for', equipment.length, 'equipment items');

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Filter equipment with valid location data
    const equipmentWithLocation = equipment.filter(item => {
      const location = getDisplayLocation(item);
      const hasLocation = location.hasLocation && location.coordinates;
      if (!hasLocation) {
        console.log(`FleetMap: Equipment "${item.name}" has no location data`);
      }
      return hasLocation;
    });

    console.log(`FleetMap: ${equipmentWithLocation.length} out of ${equipment.length} equipment items have location data`);

    if (equipmentWithLocation.length === 0) {
      console.log('FleetMap: No equipment with location data to display');
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
        console.log(`FleetMap: Marker clicked for equipment "${item.name}"`);
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
      
      console.log('FleetMap: Fitting map bounds to show all markers');
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [equipment, selectedEquipmentId, onEquipmentSelected, mapState.isMapInitialized, mapState.error]);

  // Enhanced retry handler
  const handleRetry = useCallback(() => {
    console.log('FleetMap: Manual retry triggered');
    setMapState({
      token: null,
      isTokenLoading: false,
      isMapInitialized: false,
      error: null,
      retryCount: 0,
      lastErrorType: null
    });
    
    if (map.current) {
      console.log('FleetMap: Removing existing map instance for retry');
      map.current.remove();
      map.current = null;
    }
  }, []);

  // Enhanced error state with specific error handling
  if (mapState.error) {
    const getErrorDetails = () => {
      switch (mapState.lastErrorType) {
        case 'auth':
          return {
            title: 'Authentication Error',
            description: 'Unable to authenticate with map services. Please check your session.',
            suggestion: 'Try refreshing the page or logging in again.'
          };
        case 'network':
          return {
            title: 'Network Error',
            description: 'Unable to connect to map services.',
            suggestion: 'Check your internet connection and try again.'
          };
        case 'container':
          return {
            title: 'Container Error',
            description: 'Map container not ready.',
            suggestion: 'This is usually temporary - try again.'
          };
        case 'map':
          return {
            title: 'Map Loading Error',
            description: 'Failed to initialize the map.',
            suggestion: 'There may be an issue with the map service.'
          };
        default:
          return {
            title: 'Map Error',
            description: mapState.error,
            suggestion: 'Try again or contact support if the problem persists.'
          };
      }
    };

    const errorDetails = getErrorDetails();

    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <Alert className="w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <div>
                <div className="font-medium">{errorDetails.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{errorDetails.description}</div>
                <div className="text-xs text-muted-foreground mt-1">{errorDetails.suggestion}</div>
              </div>
              {mapState.retryCount < MAX_RETRIES && (
                <Button 
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
              <div className="text-xs text-muted-foreground">
                Attempt {mapState.retryCount + 1} of {MAX_RETRIES + 1}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Enhanced loading state
  if (mapState.isTokenLoading || !mapState.isMapInitialized) {
    const loadingMessage = mapState.isTokenLoading ? 'Authenticating...' : 
                          mapState.token ? 'Loading map...' : 'Preparing...';
    
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            <div className="text-xs text-muted-foreground mt-1">
              {mapState.token ? 'Map services ready' : 'Authenticating with services'}
            </div>
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
