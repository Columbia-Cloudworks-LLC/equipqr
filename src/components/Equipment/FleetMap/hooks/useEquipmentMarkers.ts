
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Equipment } from '@/types';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { MapConfig } from '@/config/app';

interface UseEquipmentMarkersProps {
  map: mapboxgl.Map | null;
  equipment: Equipment[];
  selectedEquipmentId?: string | null;
  onEquipmentSelected?: (equipmentId: string | null) => void;
  isMapReady: boolean;
}

export function useEquipmentMarkers({
  map,
  equipment,
  selectedEquipmentId,
  onEquipmentSelected,
  isMapReady
}: UseEquipmentMarkersProps) {
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (!isMapReady || !map) {
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
        .addTo(map);

      el.addEventListener('click', () => {
        onEquipmentSelected?.(selectedEquipmentId === item.id ? null : item.id);
      });

      if (MapConfig.markers.showPopups) {
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
      }

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
      
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [equipment, selectedEquipmentId, onEquipmentSelected, isMapReady, map]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
    };
  }, []);
}
