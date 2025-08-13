import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wrench, CheckCircle2 } from 'lucide-react';
import { usePMByWorkOrderId } from '@/hooks/usePMData';

interface PMProgressIndicatorProps {
  workOrderId: string;
  hasPM: boolean;
}

const PMProgressIndicator: React.FC<PMProgressIndicatorProps> = ({ workOrderId, hasPM }) => {
  const { data: pmData } = usePMByWorkOrderId(workOrderId);

  if (!hasPM || !pmData) {
    return null;
  }

const calculateCompletionPercentage = (checklistData: unknown): number => {
    if (!Array.isArray(checklistData) || checklistData.length === 0) return 0;
    
    const completedItems = checklistData.filter((item: any) => item?.completed || item?.checked).length;
    return Math.round((completedItems / checklistData.length) * 100);
  };

  const completionPercentage = pmData?.checklist_data && Array.isArray(pmData.checklist_data)
    ? calculateCompletionPercentage(pmData.checklist_data)
    : 0;

  const isCompleted = pmData?.status === 'completed';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <Wrench className="h-4 w-4 text-primary" />
        )}
        <Badge variant="secondary" className="text-xs">
          PM {isCompleted ? 'Complete' : 'Required'}
        </Badge>
      </div>
      
      {!isCompleted && pmData?.checklist_data && (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Progress value={completionPercentage} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completionPercentage}%
          </span>
        </div>
      )}
    </div>
  );
};

export default PMProgressIndicator;