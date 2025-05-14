
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateFieldsProps {
  installDate: string;
  warrantyExpiration: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DateFields({ 
  installDate, 
  warrantyExpiration, 
  onChange 
}: DateFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="install_date">Install Date</Label>
        <Input
          id="install_date"
          name="install_date"
          type="date"
          value={installDate}
          onChange={onChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
        <Input
          id="warranty_expiration"
          name="warranty_expiration"
          type="date"
          value={warrantyExpiration}
          onChange={onChange}
        />
      </div>
    </>
  );
}
