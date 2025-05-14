
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BasicInfoFieldsProps {
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BasicInfoFields({ 
  name, 
  manufacturer, 
  model, 
  serialNumber, 
  onChange 
}: BasicInfoFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onChange}
          placeholder="Equipment Name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          name="manufacturer"
          value={manufacturer}
          onChange={onChange}
          placeholder="Manufacturer"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          name="model"
          value={model}
          onChange={onChange}
          placeholder="Model Number"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="serial_number">Serial Number</Label>
        <Input
          id="serial_number"
          name="serial_number"
          value={serialNumber}
          onChange={onChange}
          placeholder="Serial Number"
        />
      </div>
    </>
  );
}
