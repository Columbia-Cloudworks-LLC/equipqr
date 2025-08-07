import { UnifiedWorkOrder } from './unifiedWorkOrder';
import { Equipment } from './equipment';
import { Organization } from './organization';
import { PMChecklistItem } from './workOrderTypes';

// Work Order Details specific types
export interface WorkOrderDetailsProps {
  workOrder: UnifiedWorkOrder;
  equipment?: Equipment;
  pmData?: PMData;
  formMode: string;
  permissionLevels: PermissionLevels;
  currentOrganization: Organization;
}

export interface WorkOrderDetailsSidebarProps extends WorkOrderDetailsProps {
  showMobileSidebar: boolean;
  onCloseMobileSidebar: () => void;
}

export interface WorkOrderDetailsHeaderProps {
  workOrder: UnifiedWorkOrder;
  formMode: string;
  permissionLevels: PermissionLevels;
  canEdit: boolean;
  onEditClick: () => void;
}

export interface WorkOrderDetailsMobileHeaderProps extends Omit<WorkOrderDetailsHeaderProps, 'formMode' | 'permissionLevels'> {
  showMobileSidebar: boolean;
  organizationId: string;
  onToggleSidebar: () => void;
}

export interface WorkOrderDetailsStatusLockWarningProps {
  workOrder: UnifiedWorkOrder;
  isWorkOrderLocked: boolean;
  baseCanAddNotes: boolean;
  isAdmin: boolean;
  onStatusUpdate: (status: string) => void;
}

export interface PMData {
  id?: string;
  checklist?: PMChecklistItem[];
  completed_items?: number;
  total_items?: number;
  completion_percentage?: number;
  last_completed?: string;
  next_due?: string;
  status?: string;
  completed_at?: string;
  completed_by?: string;
  checklist_data?: any;
  created_at?: string;
  created_by?: string;
  equipment_id?: string;
  historical_completion_date?: string;
  historical_notes?: string;
  work_order_id?: string;
}

// Legacy type aliases for compatibility - use UnifiedWorkOrder directly
export type WorkOrderData = UnifiedWorkOrder;
export type EquipmentData = Equipment;
export type OrganizationData = Organization;

export interface TeamMemberData {
  id?: string;
  name: string;
  email?: string;
  role?: string;
}

export interface HistoricalWorkOrder extends Partial<UnifiedWorkOrder> {
  historical?: boolean;
  historical_start_date?: string;
  historical_notes?: string;
  historical_completion_date?: string;
  id: string;
  title: string;
  description: string;
  equipment_id: string;
  organization_id: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  created_date: string;
}

export interface PreventativeMaintenance {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  last_completed?: string;
  next_due?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  historical_completion_date?: string;
}

export interface PermissionLevels {
  isManager: boolean;
  isTechnician: boolean;
  isRequestor: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canViewPrivateNotes: boolean;
  canAddNotes: boolean;
  canUploadImages: boolean;
  canViewCosts: boolean;
  canEditCosts: boolean;
  canAddCosts: boolean;
}

// Import the actual WorkOrderPermissionLevels from the hook
import { WorkOrderPermissionLevels as HookWorkOrderPermissionLevels } from '@/hooks/useWorkOrderPermissionLevels';

// Extended permission interface that matches existing usage
export interface WorkOrderPermissionLevels extends HookWorkOrderPermissionLevels {
  canViewPrivateNotes: boolean;
  canUploadImages: boolean;
  canViewCosts: boolean;
  canEditCosts: boolean;
  canAddCosts: boolean;
}

// Type bridge for compatibility
export const mapPermissions = (permissions: HookWorkOrderPermissionLevels): PermissionLevels => ({
  isManager: permissions.isManager,
  isTechnician: permissions.isTechnician,
  isRequestor: permissions.isRequestor,
  canEdit: permissions.canEdit,
  canDelete: permissions.canDelete,
  canAssign: permissions.canAssign,
  canChangeStatus: permissions.canChangeStatus,
  canViewPrivateNotes: permissions.isManager,
  canAddNotes: permissions.canAddNotes,
  canUploadImages: permissions.canAddImages,
  canViewCosts: permissions.isManager || permissions.isTechnician,
  canEditCosts: permissions.isManager,
  canAddCosts: permissions.isManager,
});

export interface WorkOrderAssignmentSelectorProps {
  workOrder: UnifiedWorkOrder;
  organizationId: string;
  onCancel: () => void;
  disabled?: boolean;
}

export interface WorkOrderQuickActionsProps {
  workOrder: UnifiedWorkOrder;
  onAssignClick?: () => void;
  onReopenClick?: () => void;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: 'status_change' | 'assignment' | 'note' | 'pm_update' | 'cost_update';
  icon: React.ComponentType<{ className?: string }>;
  user: string;
  isPublic: boolean;
}

export interface WorkOrderTimelineProps {
  workOrder: UnifiedWorkOrder;
  showDetailedHistory: boolean;
}

export interface WorkOrderAcceptanceData {
  estimated_hours?: number;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}