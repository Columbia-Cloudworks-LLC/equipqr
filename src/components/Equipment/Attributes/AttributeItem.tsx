
import { EquipmentAttribute } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AttributeItemProps {
  attribute: EquipmentAttribute;
  index: number;
  onUpdate: (index: number, field: 'key' | 'value', value: string) => void;
  onRemove: (index: number) => void;
  readOnly: boolean;
  canEdit: boolean;
}

export function AttributeItem({
  attribute,
  index,
  onUpdate,
  onRemove,
  readOnly,
  canEdit
}: AttributeItemProps) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="Attribute name"
        value={attribute.key}
        onChange={(e) => onUpdate(index, 'key', e.target.value)}
        className="flex-1"
        readOnly={readOnly || !canEdit}
      />
      <Input
        placeholder="Attribute value"
        value={attribute.value || ''}
        onChange={(e) => onUpdate(index, 'value', e.target.value)}
        className="flex-1"
        readOnly={readOnly || !canEdit}
      />
      {(!readOnly && canEdit) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
