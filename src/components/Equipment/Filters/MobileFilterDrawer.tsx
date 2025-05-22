
import { Button } from "@/components/ui/button";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Filter } from "lucide-react";
import { EquipmentFilters } from "./EquipmentFilters";
import { UserOrganization } from "@/services/organization/userOrganizations";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface MobileFilterDrawerProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterTeam: string;
  onTeamChange: (value: string) => void;
  teams: string[];
  organizations?: UserOrganization[];
  selectedOrgId?: string;
  onOrganizationChange?: (orgId: string) => void;
  showOrgSelector?: boolean;
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
  organizations = [],
  selectedOrgId,
  onOrganizationChange = () => {},
  showOrgSelector = false,
  activeFilterCount
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)} 
        className="w-full mb-4"
        size="sm"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90%]">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-0">
            <EquipmentFilters
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              filterStatus={filterStatus}
              onStatusChange={onStatusChange}
              filterTeam={filterTeam}
              onTeamChange={onTeamChange}
              teams={teams}
              organizations={organizations}
              selectedOrgId={selectedOrgId}
              onOrganizationChange={onOrganizationChange}
              showOrgSelector={showOrgSelector}
              isMobile={true}
            />
          </div>
          
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="default">Apply Filters</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
