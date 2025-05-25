
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, RefreshCw, Download } from 'lucide-react';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { UserOrganization } from '@/services/organization/userOrganizations';

interface FleetMapHeaderProps {
  equipmentWithLocationCount: number;
  totalEquipmentCount: number;
  showOrgSelector: boolean;
  organizations: UserOrganization[];
  selectedOrgId?: string;
  defaultOrgId: string | null;
  onOrganizationChange: (orgId: string) => void;
  onSetDefaultOrg: (orgId: string) => Promise<boolean>;
  onRefresh: () => void;
  onExportData: () => void;
  canExport: boolean;
}

export function FleetMapHeader({
  equipmentWithLocationCount,
  totalEquipmentCount,
  showOrgSelector,
  organizations,
  selectedOrgId,
  defaultOrgId,
  onOrganizationChange,
  onSetDefaultOrg,
  onRefresh,
  onExportData,
  canExport
}: FleetMapHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
      <div className="flex items-center gap-2">
        <Map className="h-6 w-6" />
        <h1 className="text-2xl font-bold tracking-tight">Fleet Map</h1>
        <Badge variant="outline">
          {equipmentWithLocationCount} of {totalEquipmentCount} with location
        </Badge>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {showOrgSelector && (
          <OrganizationSelector
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            defaultOrgId={defaultOrgId}
            onChange={onOrganizationChange}
            onSetDefault={onSetDefaultOrg}
            showSetDefault={true}
            className="w-full sm:w-[250px]"
          />
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExportData} disabled={!canExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
