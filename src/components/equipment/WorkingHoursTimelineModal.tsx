import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, User, FileText, Calendar } from 'lucide-react';
import { 
  useEquipmentWorkingHoursHistory, 
  useEquipmentCurrentWorkingHours,
  useUpdateEquipmentWorkingHours 
} from '@/hooks/useEquipmentWorkingHours';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  equipmentName
}) => {
  const [isAddingHours, setIsAddingHours] = useState(false);
  const [newHours, setNewHours] = useState('');
  const [notes, setNotes] = useState('');

  const { data: history = [], isLoading: historyLoading } = useEquipmentWorkingHoursHistory(equipmentId);
  const { data: currentHours = 0 } = useEquipmentCurrentWorkingHours(equipmentId);
  const updateWorkingHours = useUpdateEquipmentWorkingHours();

  const handleSubmit = async () => {
    const hours = parseFloat(newHours);
    if (isNaN(hours) || hours < 0) {
      toast.error('Please enter a valid number of hours');
      return;
    }

    try {
      await updateWorkingHours.mutateAsync({
        equipmentId,
        newHours: hours,
        updateSource: 'manual',
        notes: notes.trim() || undefined
      });
      
      setNewHours('');
      setNotes('');
      setIsAddingHours(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const getSourceIcon = (source: string) => {
    return source === 'work_order' ? <FileText className="h-3 w-3" /> : <User className="h-3 w-3" />;
  };

  const getSourceLabel = (source: string) => {
    return source === 'work_order' ? 'Work Order' : 'Manual Update';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours Timeline - {equipmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Hours Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Current Working Hours</h3>
                  <p className="text-2xl font-bold text-primary">{currentHours.toLocaleString()} hours</p>
                </div>
                <Button 
                  onClick={() => setIsAddingHours(true)}
                  disabled={isAddingHours}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Update Hours
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Hours Form */}
          {isAddingHours && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h3 className="font-medium">Update Working Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New Total Hours *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Enter total working hours"
                      value={newHours}
                      onChange={(e) => setNewHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Reason for update..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={1}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmit}
                    disabled={updateWorkingHours.isPending}
                  >
                    Update Hours
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingHours(false);
                      setNewHours('');
                      setNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium">Update History</h3>
            
            {historyLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No working hours updates recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <Card key={entry.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              {getSourceIcon(entry.update_source)}
                              {getSourceLabel(entry.update_source)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {entry.updated_by_name || 'Unknown User'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>From:</strong> {entry.old_hours?.toLocaleString() || '0'} hours
                            </span>
                            <span>
                              <strong>To:</strong> {entry.new_hours.toLocaleString()} hours
                            </span>
                            <span className={`font-medium ${entry.hours_added >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.hours_added >= 0 ? '+' : ''}{entry.hours_added.toLocaleString()} hours
                            </span>
                          </div>
                          
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">{entry.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};