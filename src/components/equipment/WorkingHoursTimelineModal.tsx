import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Settings, User, FileEdit, ArrowUpDown } from 'lucide-react';
import { useEquipmentWorkingHoursHistory, useEquipmentCurrentWorkingHours, useUpdateEquipmentWorkingHours } from '@/hooks/useEquipmentWorkingHours';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';
import type { WorkingHoursHistoryEntry } from '@/services/equipmentWorkingHoursService';

interface WorkingHoursTimelineModalProps {
  open: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
}

export const WorkingHoursTimelineModal: React.FC<WorkingHoursTimelineModalProps> = ({
  open,
  onClose,
  equipmentId,
  equipmentName,
}) => {
  const [isAddingHours, setIsAddingHours] = useState(false);
  const [newHours, setNewHours] = useState('');
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: historyResult, isLoading: isLoadingHistory } = useEquipmentWorkingHoursHistory(
    equipmentId,
    currentPage,
    pageSize
  );
  const { data: currentHours, isLoading: isLoadingCurrent } = useEquipmentCurrentWorkingHours(equipmentId);
  const updateHoursMutation = useUpdateEquipmentWorkingHours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hours = parseFloat(newHours);
    if (isNaN(hours) || hours < 0) {
      toast.error('Please enter a valid number of hours');
      return;
    }

    try {
      await updateHoursMutation.mutateAsync({
        equipmentId,
        newHours: hours,
        updateSource: 'manual',
        notes: notes.trim() || undefined,
      });

      setNewHours('');
      setNotes('');
      setIsAddingHours(false);
    } catch (error) {
      console.error('Failed to update working hours:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Normalize PostgreSQL timestamp format (replace space with T for ISO compliance)
      const normalizedDate = dateString.replace(' ', 'T');
      return format(new Date(normalizedDate), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.warn('Failed to format date:', dateString, error);
      return 'Invalid date';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'work_order':
        return <FileEdit className="h-3 w-3" />;
      case 'manual':
      default:
        return <Settings className="h-3 w-3" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'work_order':
        return 'Work Order';
      case 'manual':
      default:
        return 'Manual';
    }
  };

  const columns: Column<WorkingHoursHistoryEntry>[] = [
    {
      key: 'created_at',
      title: 'Date',
      width: '180px',
      render: (entry) => (
        <div className="text-sm">
          {formatDate(entry.created_at)}
        </div>
      ),
    },
    {
      key: 'update_source',
      title: 'Source',
      width: '120px',
      render: (entry) => (
        <div className="flex items-center gap-2">
          {getSourceIcon(entry.update_source)}
          <span className="text-sm">{getSourceLabel(entry.update_source)}</span>
        </div>
      ),
    },
    {
      key: 'updated_by_name',
      title: 'Updated By',
      width: '140px',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <span className="text-sm">{entry.updated_by_name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'hours_change',
      title: 'Hours Change',
      width: '140px',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3 w-3" />
          <span className="text-sm font-medium">
            {entry.old_hours !== null ? `${entry.old_hours}` : '0'} → {entry.new_hours}
          </span>
          <span className="text-xs text-muted-foreground">
            ({entry.hours_added > 0 ? '+' : ''}{entry.hours_added})
          </span>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (entry) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {entry.notes || '—'}
        </div>
      ),
    },
  ];

  const pagination = historyResult ? {
    page: currentPage,
    limit: pageSize,
    total: historyResult.total,
    onPageChange: setCurrentPage,
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Working Hours Timeline</DialogTitle>
          <DialogDescription>
            Track and manage working hours for {equipmentName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-4">
          {/* Current Hours Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Current Working Hours</p>
              <p className="text-2xl font-semibold">
                {isLoadingCurrent ? '...' : `${currentHours || 0} hours`}
              </p>
            </div>
            <Button
              onClick={() => setIsAddingHours(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Update Hours
            </Button>
          </div>

          {/* Add Hours Form */}
          {isAddingHours && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-hours">New Total Hours</Label>
                  <Input
                    id="new-hours"
                    type="number"
                    step="0.1"
                    min="0"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    placeholder="Enter total hours"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this update"
                    rows={1}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={updateHoursMutation.isPending}
                >
                  {updateHoursMutation.isPending ? 'Updating...' : 'Update Hours'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAddingHours(false);
                    setNewHours('');
                    setNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* History Table */}
        <div className="flex-1 min-h-0">
          <DataTable
            data={historyResult?.data || []}
            columns={columns}
            isLoading={isLoadingHistory}
            pagination={pagination}
            emptyMessage="No working hours history found."
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};