
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search } from 'lucide-react';

interface FilterState {
  status: string;
  team: string;
  search: string;
  organization?: string;
}

interface Team {
  id: string;
  name: string;
}

interface FleetMapFiltersProps {
  filters: FilterState;
  teams: Team[];
  onFilterStatusChange: (status: string) => void;
  onFilterTeamChange: (team: string) => void;
  onFilterSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function FleetMapFilters({
  filters,
  teams,
  onFilterStatusChange,
  onFilterTeamChange,
  onFilterSearchChange,
  onClearFilters
}: FleetMapFiltersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Equipment</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, manufacturer, model..."
                value={filters.search}
                onChange={(e) => onFilterSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Team</label>
            <select
              value={filters.team}
              onChange={(e) => onFilterTeamChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Teams</option>
              <option value="">Unassigned</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Actions</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
