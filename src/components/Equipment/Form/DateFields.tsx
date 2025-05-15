
import { Label } from '@/components/ui/label';
import { DatePicker } from './DatePicker';

interface DateFieldsProps {
  installDate: string;
  warrantyExpiration: string;
  onChange: (name: string, value: string | null) => void;
}

export function DateFields({ 
  installDate, 
  warrantyExpiration, 
  onChange 
}: DateFieldsProps) {
  // Convert string dates to Date objects for the DatePicker
  const parseDate = (dateStr: string | null | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date : undefined;
  };

  // Format Date objects back to YYYY-MM-DD strings for the form state
  const formatDateForDb = (date: Date | undefined): string | null => {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="install_date">Install Date</Label>
        <DatePicker
          value={parseDate(installDate)}
          onChange={(date) => onChange('install_date', formatDateForDb(date))}
          placeholder="Select install date"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
        <DatePicker
          value={parseDate(warrantyExpiration)}
          onChange={(date) => onChange('warranty_expiration', formatDateForDb(date))}
          placeholder="Select warranty expiration"
        />
      </div>
    </>
  );
}
