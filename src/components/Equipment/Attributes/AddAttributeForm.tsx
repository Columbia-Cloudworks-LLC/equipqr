
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddAttributeFormProps {
  onAdd: (key: string, value: string) => void;
  isCheckingPermission: boolean;
}

export function AddAttributeForm({ onAdd, isCheckingPermission }: AddAttributeFormProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  
  const handleAddAttribute = () => {
    if (!newKey.trim()) return;
    onAdd(newKey, newValue);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <Label htmlFor="newKey">Name</Label>
        <Input
          id="newKey"
          placeholder="e.g., Motor Type"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label htmlFor="newValue">Value</Label>
        <Input
          id="newValue"
          placeholder="e.g., AC Induction"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
      </div>
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleAddAttribute} 
        className="flex-shrink-0"
        disabled={isCheckingPermission}
      >
        <Plus className="h-4 w-4 mr-1" /> Add
      </Button>
    </div>
  );
}
