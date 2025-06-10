
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Navigation, Clock } from 'lucide-react';

const FleetMap = () => {
  // Mock equipment locations data
  const equipmentLocations = [
    {
      id: '1',
      name: 'Forklift FL-001',
      status: 'active',
      location: 'Warehouse A',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      lastUpdate: '2024-06-10T14:30:00Z',
      speed: 0,
      heading: 180
    },
    {
      id: '2',
      name: 'Generator GN-045',
      status: 'maintenance',
      location: 'Maintenance Bay 2',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      lastUpdate: '2024-06-10T13:45:00Z',
      speed: 0,
      heading: 90
    },
    {
      id: '3',
      name: 'Excavator EX-102',
      status: 'active',
      location: 'Construction Site B',
      coordinates: { lat: 40.7614, lng: -73.9776 },
      lastUpdate: '2024-06-10T15:20:00Z',
      speed: 15,
      heading: 45
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fleet Map</h1>
        <p className="text-muted-foreground">Track the real-time location of your equipment</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Placeholder - Will be replaced with Mapbox GL JS integration */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Fleet Location Map
              </CardTitle>
              <CardDescription>
                Real-time equipment tracking and location monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              <div className="bg-muted rounded-lg h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                  <p className="text-muted-foreground">
                    Mapbox GL JS integration will be added here to show real-time equipment locations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Locations</CardTitle>
              <CardDescription>Current equipment status and positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipmentLocations.map((equipment) => (
                <div key={equipment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{equipment.name}</h4>
                      <p className="text-sm text-muted-foreground">{equipment.location}</p>
                    </div>
                    <Badge className={getStatusColor(equipment.status)}>
                      {equipment.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{equipment.coordinates.lat.toFixed(4)}, {equipment.coordinates.lng.toFixed(4)}</span>
                    </div>
                    
                    {equipment.speed > 0 && (
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span>{equipment.speed} mph, heading {equipment.heading}°</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated {formatLastUpdate(equipment.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Map Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-refresh</span>
                <Badge variant="outline" className="bg-green-50">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Refresh interval</span>
                <span className="text-sm text-muted-foreground">30 seconds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active equipment</span>
                <span className="text-sm text-muted-foreground">
                  {equipmentLocations.filter(e => e.status === 'active').length} of {equipmentLocations.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Equipment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentLocations.length}</div>
            <p className="text-xs text-muted-foreground">Tracked locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Equipment</CardTitle>
            <Navigation className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipmentLocations.filter(e => e.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moving Equipment</CardTitle>
            <Navigation className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipmentLocations.filter(e => e.speed > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">In motion</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetMap;
