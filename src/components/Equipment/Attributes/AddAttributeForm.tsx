
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddAttributeFormProps {
  onAdd: (key: string, value: string) => void;
  isCheckingPermission: boolean;
}

export function AddAttributeForm({ onAdd, isCheckingPermission }: AddAttributeFormProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const isMobile = useIsMobile();
  
  const handleAddAttribute = () => {
    if (!newKey.trim()) return;
    onAdd(newKey, newValue);
    setNewKey('');
    setNewValue('');
  };

  if (isMobile) {
    // Mobile vertical layout
    return (
      <div className="bg-muted/50 border rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium">Add New Attribute</div>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="newKey">Name</Label>
            <Input
              id="newKey"
              placeholder="e.g., Motor Type"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="h-11" // Larger touch target
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="newValue">Value</Label>
            <Input
              id="newValue"
              placeholder="e.g., AC Induction"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-11" // Larger touch target
            />
          </div>
          
          <Button 
            type="button" 
            onClick={handleAddAttribute} 
            className="w-full h-11"
            disabled={isCheckingPermission || !newKey.trim()}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Attribute
          </Button>
        </div>
      </div>
    );
  }

  // Desktop horizontal layout (existing)
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
