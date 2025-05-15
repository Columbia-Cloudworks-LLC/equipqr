
import { EquipmentAttribute } from "@/types";
import { cn } from "@/lib/utils";

interface AttributesListProps {
  attributes: EquipmentAttribute[];
  className?: string;
}

export function AttributesList({ attributes, className }: AttributesListProps) {
  if (!attributes || attributes.length === 0) {
    return (
      <div className="text-muted-foreground italic text-sm">
        No custom attributes found for this equipment.
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {attributes.map((attribute, index) => (
        <div key={attribute.id || index} className="flex flex-col">
          <div className="text-sm font-medium">{attribute.key}</div>
          <div className="text-sm text-muted-foreground break-words">
            {attribute.value || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}
