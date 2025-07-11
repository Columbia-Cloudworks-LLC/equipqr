import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, UserPlus, RotateCcw, Eye, MoreHorizontal } from 'lucide-react';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { useNavigate } from 'react-router-dom';
import { generatePMChecklistPDF } from '@/services/workOrderPDFService';
import { generateCostsCSV } from '@/services/workOrderCSVService';
import { useToast } from '@/hooks/use-toast';

interface WorkOrderQuickActionsProps {
  workOrder: any;
  onAssignClick?: () => void;
  onReopenClick?: () => void;
  showInline?: boolean;
}

export const WorkOrderQuickActions: React.FC<WorkOrderQuickActionsProps> = ({
  workOrder,
  onAssignClick,
  onReopenClick,
  showInline = false
}) => {
  const permissions = useUnifiedPermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);

  const workOrderPermissions = permissions.workOrders.getDetailedPermissions(workOrder);
  
  const canViewPMChecklist = workOrder.has_pm;
  const canDownloadPMPDF = workOrder.has_pm && workOrder.status === 'completed';
  const canDownloadCosts = workOrderPermissions.canEdit; // Only for managers/admins
  const canReassign = workOrderPermissions.canEdit && ['submitted', 'accepted', 'assigned'].includes(workOrder.status);
  const canReopen = workOrderPermissions.canEdit && ['completed', 'cancelled'].includes(workOrder.status);

  const handleViewPMChecklist = () => {
    navigate(`/work-orders/${workOrder.id}?tab=pm`);
  };

  const handleDownloadPMPDF = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      await generatePMChecklistPDF(workOrder.id);
      toast({
        title: "PDF Generated",
        description: "PM checklist PDF has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PM PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadCosts = async () => {
    if (isGeneratingCSV) return;
    
    setIsGeneratingCSV(true);
    try {
      await generateCostsCSV(workOrder.id);
      toast({
        title: "CSV Generated",
        description: "Work order costs CSV has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to generate costs CSV",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  const actions = [
    {
      key: 'view-pm',
      label: 'View PM Checklist',
      icon: Eye,
      show: canViewPMChecklist,
      onClick: handleViewPMChecklist
    },
    {
      key: 'download-pm',
      label: 'Download PM PDF',
      icon: FileText,
      show: canDownloadPMPDF,
      onClick: handleDownloadPMPDF,
      loading: isGeneratingPDF
    },
    {
      key: 'download-costs',
      label: 'Download Costs CSV',
      icon: Download,
      show: canDownloadCosts,
      onClick: handleDownloadCosts,
      loading: isGeneratingCSV
    },
    {
      key: 'reassign',
      label: 'Reassign',
      icon: UserPlus,
      show: canReassign,
      onClick: onAssignClick
    },
    {
      key: 'reopen',
      label: 'Reopen',
      icon: RotateCcw,
      show: canReopen,
      onClick: onReopenClick
    }
  ];

  const visibleActions = actions.filter(action => action.show);

  if (visibleActions.length === 0) return null;

  if (showInline && visibleActions.length <= 2) {
    return (
      <div className="flex gap-1">
        {visibleActions.map(action => (
          <Button
            key={action.key}
            variant="outline"
            size="sm"
            onClick={action.onClick}
            disabled={action.loading}
            className="h-8 px-2"
          >
            <action.icon className="h-3 w-3" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {visibleActions.map(action => (
          <DropdownMenuItem
            key={action.key}
            onClick={action.onClick}
            disabled={action.loading}
            className="gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};