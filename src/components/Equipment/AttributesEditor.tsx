
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { EquipmentAttribute } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';

interface AttributesEditorProps {
  attributes: EquipmentAttribute[];
  onChange: (attributes: EquipmentAttribute[]) => void;
  className?: string;
  readOnly?: boolean;
}

export function AttributesEditor({ 
  attributes = [], 
  onChange, 
  className, 
  readOnly = false 
}: AttributesEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { user } = useAuthState();
  const [canEdit, setCanEdit] = useState(false);

  // Check if user has permission to edit attributes based on role
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setCanEdit(false);
        return;
      }
      
      try {
        // Get user roles or team roles - simplified check for now
        // In a real app, you'd check team roles as well
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
        if (data && ['owner', 'manager', 'admin'].includes(data.role)) {
          setCanEdit(true);
        } else {
          // Default to false - a more complete implementation would check team roles too
          setCanEdit(false);
        }
      } catch (error) {
        console.error('Error checking user roles:', error);
        setCanEdit(false);
      }
    };
    
    checkPermission();
  }, [user]);

  const handleAddAttribute = () => {
    if (!newKey.trim() || readOnly || !canEdit) return;
    
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
    if (readOnly || !canEdit) return;
    
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { 
      ...updatedAttributes[index], 
      [field]: value 
    };
    onChange(updatedAttributes);
  };

  const handleRemoveAttribute = (index: number) => {
    if (readOnly || !canEdit) return;
    
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
        {attributes.length === 0 && (
          <div className="text-sm text-muted-foreground italic">
            No custom attributes
          </div>
        )}
        
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder="Attribute name"
              value={attr.key}
              onChange={(e) => handleUpdateAttribute(index, 'key', e.target.value)}
              className="flex-1"
              readOnly={readOnly || !canEdit}
            />
            <Input
              placeholder="Attribute value"
              value={attr.value || ''}
              onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
              className="flex-1"
              readOnly={readOnly || !canEdit}
            />
            {(!readOnly && canEdit) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveAttribute(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add new attribute form - only show if not readonly and user can edit */}
      {(!readOnly && canEdit) && (
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
      )}
    </div>
  );
}

export default AttributesEditor;
