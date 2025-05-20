
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface EmptyStateProps {
  onCheckAgain: () => void;
}

export const EmptyState = ({ onCheckAgain }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
    <Check className="h-10 w-10 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium">No pending invitations</h3>
    <p className="text-muted-foreground mt-2">
      You don't have any pending team or organization invitations at the moment.
    </p>
    <Button 
      variant="outline" 
      className="mt-4"
      onClick={onCheckAgain}
    >
      Check again
    </Button>
  </div>
);
