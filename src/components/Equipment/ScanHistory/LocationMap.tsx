
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { ScanHistoryEntry } from '@/services/equipment/enhancedScanService';

interface LocationMapProps {
  scanRecords: ScanHistoryEntry[];
  height?: string;
  highlightedRecordId?: string | null;
  onRecordHighlighted?: (recordId: string | null) => void;
}

export function LocationMap({ 
  scanRecords, 
  height = '400px', 
  highlightedRecordId, 
  onRecordHighlighted 
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter records that have location data
  const recordsWithLocation = scanRecords.filter(
    record => record.latitude && record.longitude
  );

  // Fetch Mapbox token from Supabase Edge Function
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
    if (!mapContainer.current || !mapboxToken || recordsWithLocation.length === 0) {
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

      // Add markers for each scan location
      const bounds = new mapboxgl.LngLatBounds();
      
      recordsWithLocation.forEach((record, index) => {
        if (!record.latitude || !record.longitude) return;

        const coords: [number, number] = [record.longitude, record.latitude];
        bounds.extend(coords);

        // Create marker color based on scan method
        const markerColor = record.scan_method === 'qr_code' ? '#3b82f6' : '#64748b';

        // Create custom marker
        const marker = new mapboxgl.Marker({ color: markerColor })
          .setLngLat(coords);

        // Create popup content
        const popupContent = `
          <div class="p-3 max-w-xs">
            <div class="font-medium mb-2">${record.user_display_name || 'Anonymous User'}</div>
            <div class="text-sm text-gray-600 mb-2">${record.user_org_name || 'Unknown Organization'}</div>
            <div class="text-xs space-y-1">
              <div><strong>Time:</strong> ${formatDistanceToNow(new Date(record.ts), { addSuffix: true })}</div>
              <div><strong>Method:</strong> ${record.scan_method === 'qr_code' ? 'QR Code' : 'Direct Access'}</div>
              <div><strong>Device:</strong> ${record.device_type || 'Unknown'}</div>
              <div><strong>Browser:</strong> ${record.browser_name || 'Unknown'} ${record.browser_version || ''}</div>
              ${record.location_accuracy ? `<div><strong>Accuracy:</strong> ±${Math.round(record.location_accuracy)}m</div>` : ''}
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);

        marker.setPopup(popup);
        marker.addTo(map.current!);
        
        // Store marker reference
        markers.current.set(record.id, marker);

        // Add click handler to notify parent component
        marker.getElement().addEventListener('click', () => {
          onRecordHighlighted?.(record.id);
        });
      });

      // Fit map to show all markers
      if (recordsWithLocation.length === 1) {
        map.current.setCenter([recordsWithLocation[0].longitude!, recordsWithLocation[0].latitude!]);
        map.current.setZoom(12);
      } else if (recordsWithLocation.length > 1) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();
      map.current?.remove();
    };
  }, [mapboxToken, recordsWithLocation, onRecordHighlighted]);

  // Handle highlighting specific record
  useEffect(() => {
    if (!highlightedRecordId || !map.current) return;

    const marker = markers.current.get(highlightedRecordId);
    if (marker) {
      // Center map on highlighted marker
      const lngLat = marker.getLngLat();
      map.current.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 15,
        duration: 1000
      });

      // Open popup for highlighted marker
      marker.togglePopup();
    }
  }, [highlightedRecordId]);

  if (recordsWithLocation.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium mb-1">No Location Data</h3>
          <p className="text-sm text-muted-foreground">
            No scan records with location information are available for this equipment.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
              <h3 className="font-medium mb-1">Loading Map</h3>
              <p className="text-sm text-muted-foreground">
                Initializing map configuration...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <h3 className="font-medium mb-1 text-red-600">Map Unavailable</h3>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          style={{ height }}
          className="w-full rounded-lg"
        />
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {recordsWithLocation.length} location{recordsWithLocation.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs">QR Code</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-xs">Direct Access</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
