
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { WorkOrderCostItem } from '@/hooks/useWorkOrderCostsState';
import { useIsMobile } from '@/hooks/use-mobile';

interface WorkOrderCostsEditorProps {
  costs: WorkOrderCostItem[];
  onAddCost: () => void;
  onRemoveCost: (id: string) => void;
  onUpdateCost: (id: string, field: keyof WorkOrderCostItem, value: any) => void;
  hasError?: boolean;
}

const WorkOrderCostsEditor: React.FC<WorkOrderCostsEditorProps> = ({
  costs,
  onAddCost,
  onRemoveCost,
  onUpdateCost,
  hasError = false
}) => {
  const isMobile = useIsMobile();
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };

  const calculateSubtotal = () => {
    return costs.reduce((sum, cost) => sum + cost.total_price_cents, 0);
  };

  const MobileCostItem = ({ cost }: { cost: WorkOrderCostItem }) => (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Description</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveCost(cost.id)}
          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
          disabled={costs.length === 1}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <Input
        value={cost.description}
        onChange={(e) => onUpdateCost(cost.id, 'description', e.target.value)}
        placeholder="Enter description..."
        className="h-9"
      />
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            Quantity
          </label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={cost.quantity}
            onChange={(e) => onUpdateCost(cost.id, 'quantity', parseFloat(e.target.value) || 1)}
            placeholder="Qty"
            className="h-9"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            Unit Price
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cost.unit_price_cents / 100}
              onChange={(e) => onUpdateCost(cost.id, 'unit_price_cents', Math.round((parseFloat(e.target.value) || 0) * 100))}
              placeholder="0.00"
              className="h-9"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm font-medium text-muted-foreground">Total:</span>
        <span className="font-semibold text-lg">
          {formatCurrency(cost.total_price_cents)}
        </span>
      </div>
    </div>
  );

  const DesktopCostItem = ({ cost }: { cost: WorkOrderCostItem }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
        <Input
          value={cost.description}
          onChange={(e) => onUpdateCost(cost.id, 'description', e.target.value)}
          placeholder="Enter description..."
          className="h-8"
        />
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={cost.quantity}
          onChange={(e) => onUpdateCost(cost.id, 'quantity', parseFloat(e.target.value) || 1)}
          placeholder="Qty"
          className="h-8"
        />
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={cost.unit_price_cents / 100}
            onChange={(e) => onUpdateCost(cost.id, 'unit_price_cents', Math.round((parseFloat(e.target.value) || 0) * 100))}
            placeholder="0.00"
            className="h-8"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">
            {formatCurrency(cost.total_price_cents)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveCost(cost.id)}
            className="text-red-600 hover:text-red-700"
            disabled={costs.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Cost Items
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddCost}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Cost Item
        </Button>
      </div>

      {hasError && (
        <p className="text-sm text-destructive">
          All cost items must have a description and valid quantities/prices
        </p>
      )}

      {costs.length > 0 && (
        <div className="space-y-3">
          {/* Desktop Headers */}
          {!isMobile && (
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground px-3">
              <div>Description</div>
              <div>Quantity</div>
              <div>Unit Price</div>
              <div className="text-right">Total</div>
            </div>
          )}

          {/* Cost Items */}
          <div className="space-y-3">
            {costs.map((cost) => (
              <div key={cost.id}>
                {isMobile ? (
                  <MobileCostItem cost={cost} />
                ) : (
                  <DesktopCostItem cost={cost} />
                )}
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Subtotal:</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderCostsEditor;
