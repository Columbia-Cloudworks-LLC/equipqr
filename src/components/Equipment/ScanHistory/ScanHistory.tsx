
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Monitor, Tablet, MapPin, Clock, User, Globe, Download, Search, Filter } from 'lucide-react';
import { getEnhancedScanHistory, canViewScanHistory, type ScanHistoryRecord } from '@/services/equipment/enhancedScanService';
import { formatDistanceToNow } from 'date-fns';

interface ScanHistoryProps {
  equipmentId: string;
}

export function ScanHistory({ equipmentId }: ScanHistoryProps) {
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [canView, setCanView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    loadScanHistory();
  }, [equipmentId]);

  useEffect(() => {
    applyFilters();
  }, [scanHistory, searchTerm, deviceFilter, methodFilter]);

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

    // Scan method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(record => record.scan_method === methodFilter);
    }

    setFilteredHistory(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      // Headers
      ['Timestamp', 'User', 'Organization', 'Device Type', 'Browser', 'OS', 'Scan Method', 'Location', 'Session ID'].join(','),
      // Data rows
      ...filteredHistory.map(record => [
        new Date(record.ts).toISOString(),
        record.user_display_name || 'Anonymous',
        record.user_org_name || 'Unknown',
        record.device_type || 'Unknown',
        `${record.browser_name || 'Unknown'} ${record.browser_version || ''}`.trim(),
        record.operating_system || 'Unknown',
        record.scan_method || 'direct',
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

  const getScanMethodBadge = (method?: string) => {
    const variant = method === 'qr_code' ? 'default' : 'secondary';
    const text = method === 'qr_code' ? 'QR Code' : method === 'search' ? 'Search' : 'Direct';
    return <Badge variant={variant}>{text}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
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

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="qr_code">QR Code</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="search">Search</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportToCSV} variant="outline" size="sm" disabled={filteredHistory.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredHistory.length} of {scanHistory.length} scan records
      </div>

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
                  ? "No scans recorded for this equipment yet."
                  : "No scans match your current filters."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((record) => (
            <Card key={record.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(record.device_type)}
                      <div>
                        <div className="font-medium text-sm">
                          {record.user_display_name || 'Anonymous User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.user_org_name || 'Unknown Organization'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getScanMethodBadge(record.scan_method)}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(record.ts), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Device Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Device & Browser</div>
                    <div>{record.device_type} • {record.browser_name} {record.browser_version}</div>
                    <div className="text-xs text-muted-foreground">{record.operating_system}</div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">Location & Time</div>
                    <div className="flex items-center gap-1">
                      {record.latitude && record.longitude ? (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs">Location not available</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{record.timezone}</div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">Session Info</div>
                    <div className="text-xs font-mono">{record.session_id?.slice(0, 8)}...</div>
                    <div className="text-xs text-muted-foreground">
                      {record.screen_resolution} • {record.language}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
