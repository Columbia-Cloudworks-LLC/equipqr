
import React, { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Equipment } from '@/types';
import { MapContainer } from './MapContainer';
import { MapLoadingDisplay } from './MapLoadingDisplay';
import { MapErrorDisplay } from './MapErrorDisplay';
import { useMapInitialization } from './hooks/useMapInitialization';
import { useEquipmentMarkers } from './hooks/useEquipmentMarkers';

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
  const { map, mapState, initializeFleetMap, handleRetry, cleanup } = useMapInitialization();

  // Initialize map
  useEffect(() => {
    initializeFleetMap(mapContainer.current);
    return cleanup;
  }, [initializeFleetMap, cleanup]);

  // Handle equipment markers
  useEquipmentMarkers({
    map,
    equipment,
    selectedEquipmentId,
    onEquipmentSelected,
    isMapReady: mapState.loadingState === 'ready'
  });
  
  return (
    <MapContainer ref={mapContainer} height={height}>
      {mapState.loadingState === 'loading' && <MapLoadingDisplay />}
      
      {mapState.loadingState === 'error' && (
        <MapErrorDisplay
          error={mapState.error || 'Unknown error'}
          retryCount={mapState.retryCount}
          onRetry={handleRetry}
        />
      )}
    </MapContainer>
  );
}
