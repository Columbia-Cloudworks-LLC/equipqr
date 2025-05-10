
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Save } from 'lucide-react';
import { EquipmentAttribute } from '@/types';
import { cn } from '@/lib/utils';

interface AttributesEditorProps {
  attributes: EquipmentAttribute[];
  onChange: (attributes: EquipmentAttribute[]) => void;
  className?: string;
}

export function AttributesEditor({ attributes = [], onChange, className }: AttributesEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAddAttribute = () => {
    if (!newKey.trim()) return;
    
    // Check for duplicate keys
    const isDuplicate = attributes.some(attr => attr.key.toLowerCase() === newKey.toLowerCase());
    if (isDuplicate) return;
    
    const newAttribute: EquipmentAttribute = {
      equipment_id: '', // This will be set when saving the equipment
      key: newKey,
      value: newValue
    };
    
    onChange([...attributes, newAttribute]);
    setNewKey('');
    setNewValue('');
  };

  const handleUpdateAttribute = (index: number, field: 'key' | 'value', value: string) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { 
      ...updatedAttributes[index], 
      [field]: value 
    };
    onChange(updatedAttributes);
  };

  const handleRemoveAttribute = (index: number) => {
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    onChange(updatedAttributes);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Label className="text-base">Custom Attributes</Label>
      </div>

      {/* List of existing attributes */}
      <div className="space-y-2">
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder="Attribute name"
              value={attr.key}
              onChange={(e) => handleUpdateAttribute(index, 'key', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Attribute value"
              value={attr.value || ''}
              onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveAttribute(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new attribute form */}
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
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

export default AttributesEditor;
