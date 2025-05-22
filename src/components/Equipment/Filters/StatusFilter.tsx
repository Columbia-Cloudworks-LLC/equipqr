
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StatusFilter({ value, onChange, className }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || "w-[140px]"}>
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
        <SelectItem value="maintenance">Maintenance</SelectItem>
        <SelectItem value="storage">Storage</SelectItem>
        <SelectItem value="retired">Retired</SelectItem>
      </SelectContent>
    </Select>
  );
}
