import React, { useState } from 'react';
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateHistoricalWorkOrder, HistoricalWorkOrderData } from "@/hooks/useHistoricalWorkOrders";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTeams } from "@/hooks/useTeams";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useEquipmentByOrganization } from "@/hooks/useSupabaseData";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { WorkOrderPMSection } from "./WorkOrderPMSection";

// Helper function to create date with 8 AM time
const createDateWith8AM = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(8, 0, 0, 0);
  return newDate;
};

// Helper function to format date for display
const formatDateDisplay = (date: Date | null): string => {
  if (!date) return "Pick a date";
  return format(date, "PPP 'at' h:mm a");
};

// Helper function to convert Date to ISO string for submission
const dateToISOString = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString();
};

interface HistoricalWorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  equipmentId?: string;
}

export const HistoricalWorkOrderForm: React.FC<HistoricalWorkOrderFormProps> = ({
  open,
  onClose,
  equipmentId
}) => {
  const { currentOrganization } = useOrganization();
  const { data: equipment = [] } = useEquipmentByOrganization();
  const { teams } = useTeams();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id!);
  const createHistoricalWorkOrder = useCreateHistoricalWorkOrder();
  const navigate = useNavigate();

  // State for team members of selected equipment's team
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  
  // Date states for the calendar components
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState<HistoricalWorkOrderData>({
    equipmentId: equipmentId || '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'completed',
    historicalStartDate: '',
    historicalNotes: '',
    assigneeId: 'none',
    teamId: 'none',
    dueDate: '',
    completedDate: '',
    hasPM: false,
    pmStatus: 'pending',
    pmCompletionDate: '',
    pmNotes: '',
    pmChecklistData: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipmentId || !formData.title.trim() || !startDate) {
      return;
    }

    // Get the equipment's team to auto-assign
    const selectedEquipment = equipment.find(e => e.id === formData.equipmentId);
    const equipmentTeamId = selectedEquipment?.team_id;

    try {
      // Convert "none" values back to undefined before submission
      const submitData = {
        ...formData,
        historicalStartDate: dateToISOString(startDate),
        completedDate: dateToISOString(completionDate),
        assigneeId: formData.assigneeId === 'none' ? undefined : formData.assigneeId,
        teamId: equipmentTeamId || undefined, // Use equipment's team
      };
      const result = await createHistoricalWorkOrder.mutateAsync(submitData);
      
      // Navigate to the created work order if successful
      if (result?.work_order_id) {
        navigate(`/work-orders/${result.work_order_id}`);
      }
      
      handleClose();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      equipmentId: equipmentId || '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'completed',
      historicalStartDate: '',
      historicalNotes: '',
      assigneeId: 'none',
      teamId: 'none',
      dueDate: '',
      completedDate: '',
      hasPM: false,
      pmStatus: 'pending',
      pmCompletionDate: '',
      pmNotes: '',
      pmChecklistData: []
    });
    setTeamMembers([]);
    setStartDate(null);
    setCompletionDate(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const isValid = Boolean(
    formData.equipmentId && 
    formData.title.trim() && 
    startDate
  );

  // Get selected equipment and its team
  const selectedEquipment = equipment.find(e => e.id === formData.equipmentId);
  const equipmentTeam = teams.find(t => t.id === selectedEquipment?.team_id);
  
  // Fetch team members when equipment changes
  React.useEffect(() => {
    if (selectedEquipment?.team_id) {
      const fetchTeamMembers = async () => {
        const { data } = await supabase
          .from('team_members')
          .select(`
            user_id,
            profiles!inner(id, name, email)
          `)
          .eq('team_id', selectedEquipment.team_id);
        
        setTeamMembers(data || []);
      };
      fetchTeamMembers();
    } else {
      setTeamMembers([]);
    }
  }, [selectedEquipment?.team_id]);
  
  // Available assignees from the equipment's team
  const availableAssignees = teamMembers.map(tm => tm.profiles).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Create Historical Work Order
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Historical work orders are used to record past maintenance activities. 
            Only administrators can create historical records.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment Selection */}
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment *</Label>
            <Select
              value={formData.equipmentId}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  equipmentId: value,
                  assigneeId: 'none' // Reset assignee when equipment changes
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.manufacturer} {item.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Work order title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Work order description"
              rows={3}
            />
          </div>

          {/* Historical Information */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Historical Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateDisplay(startDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(createDateWith8AM(date));
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.status === 'completed' || formData.status === 'cancelled') && (
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !completionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateDisplay(completionDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={completionDate || undefined}
                      onSelect={(date) => {
                        if (date) {
                          setCompletionDate(createDateWith8AM(date));
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="historicalNotes">Historical Notes</Label>
              <Textarea
                id="historicalNotes"
                value={formData.historicalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, historicalNotes: e.target.value }))}
                placeholder="Notes about this historical record..."
                rows={2}
              />
            </div>
          </div>

          {/* Assignment - Only Assignee, Team is auto-determined */}
          <div className="space-y-4">
            {selectedEquipment && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  <strong>Team Assignment:</strong> {equipmentTeam?.name || 'No team assigned to equipment'}
                </div>
                {!equipmentTeam && (
                  <div className="text-sm text-destructive mt-1">
                    Equipment must be assigned to a team to select an assignee
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
                disabled={!selectedEquipment?.team_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedEquipment 
                      ? "Select equipment first" 
                      : !selectedEquipment.team_id 
                        ? "Equipment has no team assigned" 
                        : "Select assignee"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No assignee</SelectItem>
                  {availableAssignees.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEquipment?.team_id && availableAssignees.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No team members available for assignment
                </div>
              )}
            </div>
          </div>

          {/* PM Integration - Simplified to only show checkbox */}
          <WorkOrderPMSection
            values={formData}
            setValue={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || createHistoricalWorkOrder.isPending}
            >
              {createHistoricalWorkOrder.isPending ? 'Creating...' : 'Create Historical Work Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};