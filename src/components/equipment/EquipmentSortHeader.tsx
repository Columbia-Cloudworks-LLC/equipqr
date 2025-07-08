import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortConfig } from '@/hooks/useEquipmentFiltering';

interface EquipmentSortHeaderProps {
  sortConfig: SortConfig;
  onSortChange: (field: string) => void;
  resultCount: number;
  totalCount: number;
}

const EquipmentSortHeader: React.FC<EquipmentSortHeaderProps> = ({
  sortConfig,
  onSortChange,
  resultCount,
  totalCount
}) => {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'model', label: 'Model' },
    { value: 'location', label: 'Location' },
    { value: 'status', label: 'Status' },
    { value: 'installation_date', label: 'Installation Date' },
    { value: 'last_maintenance', label: 'Last Maintenance' },
    { value: 'warranty_expiration', label: 'Warranty Expiration' },
    { value: 'created_at', label: 'Date Added' },
    { value: 'updated_at', label: 'Last Updated' }
  ];

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> equipment items
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortConfig.field} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  {option.label}
                  {sortConfig.field === option.value && (
                    <div className="ml-2">
                      {getSortIcon(option.value)}
                    </div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortChange(sortConfig.field)}
          className="px-3"
        >
          {getSortIcon(sortConfig.field)}
        </Button>
      </div>
    </div>
  );
};

export default EquipmentSortHeader;