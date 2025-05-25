
import { Badge } from '@/components/ui/badge';
import { WorkOrderStatus } from '@/types/supabase-enums';

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
}

export function WorkOrderStatusBadge({ status }: WorkOrderStatusBadgeProps) {
  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'submitted':
        return 'default';
      case 'accepted':
        return 'secondary';
      case 'assigned':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'on_hold':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: WorkOrderStatus) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'accepted':
        return 'Accepted';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'on_hold':
        return 'On Hold';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
