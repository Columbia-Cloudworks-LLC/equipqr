
import React, { forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MapContainerProps {
  height?: string;
  children?: React.ReactNode;
}

export const MapContainer = forwardRef<HTMLDivElement, MapContainerProps>(
  ({ height = '400px', children }, ref) => {
    return (
      <Card style={{ height }}>
        <CardContent className="p-0 h-full relative">
          <div ref={ref} className="w-full h-full rounded-lg" />
          {children}
        </CardContent>
      </Card>
    );
  }
);

MapContainer.displayName = 'MapContainer';
