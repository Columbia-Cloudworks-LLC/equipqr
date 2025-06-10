import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Monitor, Tablet, MapPin, Clock, User, Globe, Download, Search, Filter, Map } from 'lucide-react';
import { getEnhancedScanHistory, canViewScanHistory, type ScanHistoryEntry } from '@/services/equipment/enhancedScanService';
import { formatDistanceToNow } from 'date-fns';
import { LocationMap } from './LocationMap';

interface ScanHistoryProps {
  equipmentId: string;
}

export function ScanHistory({ equipmentId }: ScanHistoryProps) {
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [canView, setCanView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('list');
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);

  useEffect(() => {
    loadScanHistory();
  }, [equipmentId]);

  useEffect(() => {
    applyFilters();
  }, [scanHistory, searchTerm, deviceFilter]);

  const loadScanHistory = async () => {
    try {
      setLoading(true);
      
      // Check permissions first
      const hasPermission = await canViewScanHistory(equipmentId);
      setCanView(hasPermission);
      
      if (hasPermission) {
        const history = await getEnhancedScanHistory(equipmentId);
        setScanHistory(history);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = scanHistory;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.user_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user_org_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.operating_system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.browser_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Device type filter
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(record => record.device_type === deviceFilter);
    }

    setFilteredHistory(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      // Headers
      ['Timestamp', 'User', 'Organization', 'Device Type', 'Browser', 'OS', 'Location', 'Session ID'].join(','),
      // Data rows
      ...filteredHistory.map(record => [
        new Date(record.ts).toISOString(),
        record.user_display_name || 'Anonymous',
        record.user_org_name || 'Unknown',
        record.device_type || 'Unknown',
        `${record.browser_name || 'Unknown'} ${record.browser_version || ''}`.trim(),
        record.operating_system || 'Unknown',
        record.latitude && record.longitude ? `${record.latitude}, ${record.longitude}` : 'Not available',
        record.session_id || 'Unknown'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${equipmentId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatDeviceInfo = (record: ScanHistoryEntry) => {
    const parts = [];
    if (record.device_type) parts.push(record.device_type);
    if (record.browser_name) {
      const browser = record.browser_version 
        ? `${record.browser_name} ${record.browser_version}`
        : record.browser_name;
      parts.push(browser);
    }
    return parts.join(' • ');
  };

  const showLocationOnMap = (recordId: string) => {
    setHighlightedRecordId(recordId);
    setActiveTab('map');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-3">
            <div className="text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
            </div>
            <h3 className="font-medium">Access Restricted</h3>
            <p className="text-sm text-muted-foreground">
              You need technician, manager, or organization admin privileges to view scan history.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recordsWithLocation = filteredHistory.filter(record => record.latitude && record.longitude);

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportToCSV} variant="outline" size="sm" disabled={filteredHistory.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {filteredHistory.length} of {scanHistory.length} QR code scans
        </span>
        {recordsWithLocation.length > 0 && (
          <span>
            {recordsWithLocation.length} with location data
          </span>
        )}
      </div>

      {/* Tabs for List and Map views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">
            <User className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map" disabled={recordsWithLocation.length === 0}>
            <Map className="h-4 w-4 mr-2" />
            Map View ({recordsWithLocation.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {/* Scan History List */}
          {filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                  </div>
                  <h3 className="font-medium">No Scan History</h3>
                  <p className="text-sm text-muted-foreground">
                    {scanHistory.length === 0 
                      ? "No QR code scans recorded for this equipment yet."
                      : "No scans match your current filters."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((record) => (
                <Card key={record.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    {/* Primary Information - User, Org, Time */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getDeviceIcon(record.device_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-base">
                            {record.user_display_name || 'Anonymous User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.user_org_name || 'Unknown Organization'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium">
                          {formatDistanceToNow(new Date(record.ts), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(record.ts).toLocaleDateString()} {new Date(record.ts).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Secondary Information - Device, Location, Technical */}
                    <div className="space-y-2 border-t pt-3">
                      {/* Device Information */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Device</span>
                          <span className="text-sm">
                            {formatDeviceInfo(record)}
                          </span>
                        </div>
                        
                        {record.operating_system && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">OS</span>
                            <span className="text-sm">{record.operating_system}</span>
                          </div>
                        )}
                      </div>

                      {/* Location Information */}
                      {record.latitude && record.longitude && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</span>
                          <button
                            onClick={() => showLocationOnMap(record.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                          </button>
                          {record.timezone && (
                            <span className="text-xs text-muted-foreground">({record.timezone})</span>
                          )}
                        </div>
                      )}

                      {/* Technical Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        {record.session_id && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium uppercase tracking-wide">Session</span>
                            <span className="font-mono">{record.session_id.slice(0, 8)}...</span>
                          </div>
                        )}
                        
                        {record.screen_resolution && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium uppercase tracking-wide">Screen</span>
                            <span>{record.screen_resolution}</span>
                          </div>
                        )}
                        
                        {record.language && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium uppercase tracking-wide">Language</span>
                            <span>{record.language}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <LocationMap 
            scanRecords={filteredHistory} 
            height="500px" 
            highlightedRecordId={highlightedRecordId}
            onRecordHighlighted={setHighlightedRecordId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
