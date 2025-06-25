
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Users, Calculator } from 'lucide-react';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PurchaseLicensesDialogProps {
  currentLicenses: number;
  availableSlots: number;
  onPurchaseComplete?: () => void;
}

const PurchaseLicensesDialog: React.FC<PurchaseLicensesDialogProps> = ({
  currentLicenses,
  availableSlots,
  onPurchaseComplete
}) => {
  const { currentOrganization } = useUnifiedOrganization();
  const [quantity, setQuantity] = useState(5);
  const [isOpen, setIsOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyAmount = quantity * 10;

  const handlePurchase = async () => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    if (quantity < 1) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setIsPurchasing(true);
      toast.loading(`Creating checkout for ${quantity} user license${quantity > 1 ? 's' : ''}...`);
      
      const { data, error } = await supabase.functions.invoke('purchase-user-licenses', {
        body: { 
          quantity, 
          organizationId: currentOrganization.id 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      toast.success('Redirecting to Stripe checkout...');
      setIsOpen(false);
      onPurchaseComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout';
      console.error('Error creating license checkout:', err);
      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  const commonQuantities = [5, 10, 25, 50];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase User Licenses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Purchase User Licenses
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg text-sm">
            <div className="flex justify-between">
              <span>Current licenses:</span>
              <span className="font-medium">{currentLicenses}</span>
            </div>
            <div className="flex justify-between">
              <span>Available slots:</span>
              <span className="font-medium">{availableSlots}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Number of licenses to purchase</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="Enter quantity"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {commonQuantities.map((qty) => (
              <Button
                key={qty}
                variant={quantity === qty ? "default" : "outline"}
                size="sm"
                onClick={() => setQuantity(qty)}
              >
                {qty}
              </Button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Calculator className="h-4 w-4" />
              <span className="font-medium">Pricing Summary</span>
            </div>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>{quantity} license{quantity > 1 ? 's' : ''} × $10/month</span>
                <span className="font-medium">${monthlyAmount}/month</span>
              </div>
              <div className="text-xs text-blue-600">
                Monthly subscription • Cancel anytime
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="flex-1"
            >
              {isPurchasing ? 'Processing...' : `Purchase $${monthlyAmount}/mo`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseLicensesDialog;
