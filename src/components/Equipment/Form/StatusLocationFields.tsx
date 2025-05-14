
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusLocationFieldsProps {
  status: string;
  location: string;
  onStatusChange: (value: string) => void;
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StatusLocationFields({
  status,
  location,
  onStatusChange,
  onLocationChange
}: StatusLocationFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={status} 
          onValueChange={onStatusChange}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={location}
          onChange={onLocationChange}
          placeholder="Where is this equipment located"
        />
      </div>
    </>
  );
}
