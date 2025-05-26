
import { useState } from 'react';
import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SearchField } from './SearchField';
import { StatusFilter } from './StatusFilter';
import { TeamFilter } from './TeamFilter';

interface MobileFilterDrawerProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterTeam: string;
  onTeamChange: (team: string) => void;
  teams: string[];
  activeFilterCount: number;
}

export function MobileFilterDrawer({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterTeam,
  onTeamChange,
  teams,
  activeFilterCount
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Equipment</DrawerTitle>
          <DrawerDescription>
            Apply filters to find specific equipment
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <SearchField 
            value={searchQuery}
            onChange={onSearchChange}
          />
          <StatusFilter 
            value={filterStatus}
            onChange={onStatusChange}
          />
          <TeamFilter 
            value={filterTeam}
            onChange={onTeamChange}
            teams={teams}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
