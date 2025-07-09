import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Calendar,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { EquipmentFilters } from '@/hooks/useEquipmentFiltering';

interface EnhancedEquipmentFiltersProps {
  filters: EquipmentFilters;
  showAdvancedFilters: boolean;
  hasActiveFilters: boolean;
  filterOptions: {
    manufacturers: string[];
    locations: string[];
    teams: { id: string; name: string }[];
  };
  onFilterChange: (key: keyof EquipmentFilters, value: any) => void;
  onToggleAdvanced: () => void;
  onClearFilters: () => void;
  onQuickFilter: (type: string) => void;
}

const EnhancedEquipmentFilters: React.FC<EnhancedEquipmentFiltersProps> = ({
  filters,
  showAdvancedFilters,
  hasActiveFilters,
  filterOptions,
  onFilterChange,
  onToggleAdvanced,
  onClearFilters,
  onQuickFilter
}) => {
  const isMobile = useIsMobile();

  const quickFilters = [
    {
      id: 'maintenance-due',
      label: 'Maintenance Due',
      icon: Wrench,
      variant: 'secondary' as const
    },
    {
      id: 'warranty-expiring',
      label: 'Warranty Expiring',
      icon: AlertTriangle,
      variant: 'destructive' as const
    },
    {
      id: 'recently-added',
      label: 'Recently Added',
      icon: Clock,
      variant: 'outline' as const
    },
    {
      id: 'active-only',
      label: 'Active Only',
      icon: CheckCircle,
      variant: 'default' as const
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filters & Search</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search equipment, manufacturer, model, serial number..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.id}
                  variant={filter.variant}
                  size="sm"
                  onClick={() => onQuickFilter(filter.id)}
                  className="h-8"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Manufacturer</Label>
            <Select value={filters.manufacturer} onValueChange={(value) => onFilterChange('manufacturer', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {filterOptions.manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Location</Label>
            <Select value={filters.location} onValueChange={(value) => onFilterChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {filterOptions.locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Collapsible open={showAdvancedFilters} onOpenChange={onToggleAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
              <span className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </span>
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Team Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Assigned Team</Label>
              <Select value={filters.team} onValueChange={(value) => onFilterChange('team', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {filterOptions.teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Maintenance Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={filters.maintenanceDateFrom}
                      onChange={(e) => onFilterChange('maintenanceDateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={filters.maintenanceDateTo}
                      onChange={(e) => onFilterChange('maintenanceDateTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Installation Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={filters.installationDateFrom}
                      onChange={(e) => onFilterChange('installationDateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={filters.installationDateTo}
                      onChange={(e) => onFilterChange('installationDateTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Special Filters</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="warranty-expiring"
                  checked={filters.warrantyExpiring}
                  onCheckedChange={(checked) => onFilterChange('warrantyExpiring', checked)}
                />
                <Label htmlFor="warranty-expiring" className="text-sm font-normal">
                  Show only equipment with warranty expiring within 30 days
                </Label>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
            <div className="flex flex-wrap gap-1">
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.search}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('search', '')}
                  />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('status', 'all')}
                  />
                </Badge>
              )}
              {filters.manufacturer !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Manufacturer: {filters.manufacturer}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('manufacturer', 'all')}
                  />
                </Badge>
              )}
              {filters.location !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Location: {filters.location}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('location', 'all')}
                  />
                </Badge>
              )}
              {filters.warrantyExpiring && (
                <Badge variant="destructive" className="text-xs">
                  Warranty Expiring
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('warrantyExpiring', false)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedEquipmentFilters;