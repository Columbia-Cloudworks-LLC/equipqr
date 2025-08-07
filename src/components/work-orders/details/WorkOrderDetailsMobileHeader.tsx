import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Menu, Clipboard } from 'lucide-react';
import { getPriorityColor, getStatusColor, formatStatus } from '@/utils/workOrderHelpers';
import { WorkOrderPrimaryActionButton } from './WorkOrderPrimaryActionButton';

import { WorkOrderDetailsMobileHeaderProps as MobileHeaderProps } from '@/types/workOrderDetails';

type WorkOrderDetailsMobileHeaderProps = MobileHeaderProps;

export const WorkOrderDetailsMobileHeader: React.FC<WorkOrderDetailsMobileHeaderProps> = ({
  workOrder,
  canEdit,
  showMobileSidebar,
  organizationId,
  onEditClick,
  onToggleSidebar
}) => {
  return (
    <div className="sticky top-0 z-10 bg-background border-b lg:hidden">
      <div className="p-4">
        {/* Top Row: Back Button and Actions */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onEditClick}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleSidebar}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title Section */}
        <div className="space-y-2">
          {/* Work Order Title */}
          <div className="flex items-start gap-2">
            <h1 className="text-lg font-bold leading-tight line-clamp-2 flex-1">
              {workOrder.title}
            </h1>
            {workOrder.has_pm && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs shrink-0 mt-0.5">
                <Clipboard className="h-3 w-3 mr-1" />
                PM
              </Badge>
            )}
          </div>

          {/* Status and Priority Badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor(workOrder.priority)} text-xs`}>
                {workOrder.priority}
              </Badge>
              <Badge className={`${getStatusColor(workOrder.status)} text-xs`}>
                {formatStatus(workOrder.status)}
              </Badge>
            </div>
            
            {/* Primary Action Button */}
            <WorkOrderPrimaryActionButton 
              workOrder={workOrder}
              organizationId={organizationId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};