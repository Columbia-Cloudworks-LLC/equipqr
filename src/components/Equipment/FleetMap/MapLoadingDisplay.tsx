
import React from 'react';
import { MapPin } from 'lucide-react';

export function MapLoadingDisplay() {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
      <div className="text-center">
        <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Initializing map...</p>
      </div>
    </div>
  );
}
