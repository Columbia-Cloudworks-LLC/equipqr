import React from 'react';
import { Badge } from '@/components/ui/badge';

type EquipmentStatus = 'active' | 'maintenance' | 'inactive';
type WorkOrderStatus = 'submitted' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

interface StatusBadgeProps {
  status: EquipmentStatus | WorkOrderStatus;
  type?: 'equipment' | 'workOrder';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type = "equipment" 
}) => {
  const statusConfig = {
    equipment: {
      active: { variant: "default" as const, label: "Active" },
      maintenance: { variant: "destructive" as const, label: "Maintenance" },
      inactive: { variant: "secondary" as const, label: "Inactive" }
    },
    workOrder: {
      submitted: { variant: "outline" as const, label: "Submitted" },
      in_progress: { variant: "secondary" as const, label: "In Progress" },
      completed: { variant: "default" as const, label: "Completed" },
      on_hold: { variant: "destructive" as const, label: "On Hold" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" }
    }
  };
  
  const config = statusConfig[type][status as keyof typeof statusConfig[typeof type]];
  
  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Utility function to get status color for custom styling (legacy support)
export const getStatusColor = (status: string, type: 'equipment' | 'workOrder' = 'equipment') => {
  const colorMap = {
    equipment: {
      active: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    workOrder: {
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
  };
  
  return colorMap[type][status as keyof typeof colorMap[typeof type]] || 'bg-gray-100 text-gray-800 border-gray-200';
};