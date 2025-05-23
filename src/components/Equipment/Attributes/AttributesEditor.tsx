
import { Label } from '@/components/ui/label';
import { EquipmentAttribute } from '@/types';
import { cn } from '@/lib/utils';
import { useAttributePermissions } from './useAttributePermissions';
import { AttributeItem } from './AttributeItem';
import { AddAttributeForm } from './AddAttributeForm';
import { useIsMobile } from '@/hooks/use-mobile';

interface AttributesEditorProps {
  attributes: EquipmentAttribute[];
  onChange: (attributes: EquipmentAttribute[]) => void;
  className?: string;
  readOnly?: boolean;
  equipmentId?: string;
}

export function AttributesEditor({ 
  attributes = [], 
  onChange, 
  className, 
  readOnly = false,
  equipmentId
}: AttributesEditorProps) {
  const { canEdit, isCheckingPermission, permissionCheckError } = useAttributePermissions(equipmentId, readOnly);
  const isMobile = useIsMobile();

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

  const handleAddAttribute = (key: string, value: string) => {
    if (readOnly || !canEdit) return;
    
    // Check for duplicate keys
    const isDuplicate = attributes.some(attr => attr.key.toLowerCase() === key.toLowerCase());
    if (isDuplicate) return;
    
    // Create a new attribute with a temporary ID that will be replaced when saving
    const newAttribute: EquipmentAttribute = {
      id: `temp-${Date.now()}`, // Temporary ID until saved to the database
      equipment_id: equipmentId || '', 
      key: key,
      value: value
    };
    
    onChange([...attributes, newAttribute]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Label className="text-base">Custom Attributes</Label>
        {permissionCheckError && (
          <div className="text-sm text-red-500">{permissionCheckError}</div>
        )}
      </div>

      {/* List of existing attributes */}
      <div className={cn("space-y-3", isMobile ? "space-y-4" : "space-y-2")}>
        {attributes.length === 0 && (
          <div className="text-sm text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
            No custom attributes
          </div>
        )}
        
        {attributes.map((attr, index) => (
          <AttributeItem
            key={attr.id || index}
            attribute={attr}
            index={index}
            onUpdate={handleUpdateAttribute}
            onRemove={handleRemoveAttribute}
            readOnly={readOnly}
            canEdit={canEdit}
          />
        ))}
      </div>

      {/* Add new attribute form - only show if not readonly and user can edit */}
      {(!readOnly && canEdit) && (
        <AddAttributeForm 
          onAdd={handleAddAttribute} 
          isCheckingPermission={isCheckingPermission} 
        />
      )}
    </div>
  );
}
