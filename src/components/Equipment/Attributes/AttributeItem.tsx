
import { EquipmentAttribute } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile card layout - vertical stacking
    return (
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium text-muted-foreground">Custom Attribute</div>
          {(!readOnly && canEdit) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., Motor Type"
              value={attribute.key}
              onChange={(e) => onUpdate(index, 'key', e.target.value)}
              readOnly={readOnly || !canEdit}
              className="h-11" // Larger touch target
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">Value</label>
            <Input
              placeholder="e.g., AC Induction"
              value={attribute.value || ''}
              onChange={(e) => onUpdate(index, 'value', e.target.value)}
              readOnly={readOnly || !canEdit}
              className="h-11" // Larger touch target
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop horizontal layout (existing)
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
