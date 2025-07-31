import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, History, Wrench } from "lucide-react";
import { useCreateHistoricalWorkOrder, HistoricalWorkOrderData } from "@/hooks/useHistoricalWorkOrders";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTeams } from "@/hooks/useTeams";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useEquipmentByOrganization } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    
    if (!formData.equipmentId || !formData.title || !formData.historicalStartDate) {
      return;
    }

    try {
      // Convert "none" values back to undefined before submission
      const submitData = {
        ...formData,
        assigneeId: formData.assigneeId === 'none' ? undefined : formData.assigneeId,
        teamId: formData.teamId === 'none' ? undefined : formData.teamId,
      };
      await createHistoricalWorkOrder.mutateAsync(submitData);
      onClose();
      resetForm();
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
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const isValid = formData.equipmentId && formData.title && formData.historicalStartDate;

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
              onValueChange={(value) => setFormData(prev => ({ ...prev, equipmentId: value }))}
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
                <Label htmlFor="historicalStartDate">Start Date *</Label>
                <Input
                  id="historicalStartDate"
                  type="datetime-local"
                  value={formData.historicalStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, historicalStartDate: e.target.value }))}
                />
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
                <Label htmlFor="completedDate">Completion Date</Label>
                <Input
                  id="completedDate"
                  type="datetime-local"
                  value={formData.completedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, completedDate: e.target.value }))}
                />
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

          {/* Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No assignee</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PM Integration */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPM"
                checked={formData.hasPM}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasPM: checked as boolean }))}
              />
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <Label htmlFor="hasPM" className="cursor-pointer">
                  Include Preventative Maintenance
                </Label>
              </div>
            </div>

            {formData.hasPM && (
              <div className="space-y-4 ml-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pmStatus">PM Status</Label>
                    <Select
                      value={formData.pmStatus}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, pmStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.pmStatus === 'completed' && (
                    <div className="space-y-2">
                      <Label htmlFor="pmCompletionDate">PM Completion Date</Label>
                      <Input
                        id="pmCompletionDate"
                        type="datetime-local"
                        value={formData.pmCompletionDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, pmCompletionDate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pmNotes">PM Notes</Label>
                  <Textarea
                    id="pmNotes"
                    value={formData.pmNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, pmNotes: e.target.value }))}
                    placeholder="Preventative maintenance notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

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