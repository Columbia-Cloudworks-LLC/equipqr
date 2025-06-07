
import { useCallback, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';
import { MapConfig, ApiConfig } from '@/config/app';

type LoadingState = 'loading' | 'ready' | 'error';

interface MapState {
  loadingState: LoadingState;
  error: string | null;
  retryCount: number;
}

export function useMapInitialization() {
  const map = useRef<mapboxgl.Map | null>(null);
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
  const initializeMap = useCallback(async (container: HTMLDivElement, token: string): Promise<void> => {
    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container,
      style: MapConfig.style,
      center: MapConfig.defaultCenter,
      zoom: MapConfig.defaultZoom,
      maxZoom: MapConfig.maxZoom,
      minZoom: MapConfig.minZoom,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Map initialization timeout'));
      }, ApiConfig.requestTimeout);

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

  // Main initialization function
  const initializeFleetMap = useCallback(async (container: HTMLDivElement | null) => {
    if (!container || initializationAttempted.current) {
      return;
    }

    initializationAttempted.current = true;

    try {
      setMapState(prev => ({ ...prev, loadingState: 'loading', error: null }));
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await fetchMapboxToken();
      await initializeMap(container, token);
      
      setMapState(prev => ({ 
        ...prev, 
        loadingState: 'ready',
        retryCount: 0 
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
      setMapState(prev => ({ 
        ...prev, 
        loadingState: 'error',
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [fetchMapboxToken, initializeMap]);

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

  const cleanup = useCallback(() => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  }, []);

  return {
    map: map.current,
    mapState,
    initializeFleetMap,
    handleRetry,
    cleanup
  };
}
