
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EquipmentDetailLoadingProps {
  onBackClick: () => void;
}

export function EquipmentDetailLoading({ onBackClick }: EquipmentDetailLoadingProps) {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 bg-gray-200 rounded"></div>
        <div className="h-60 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
