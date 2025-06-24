import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Printer } from 'lucide-react';
import { PMChecklistItem, PreventativeMaintenance, updatePM } from '@/services/preventativeMaintenanceService';
import { toast } from 'sonner';

interface PMChecklistComponentProps {
  pm: PreventativeMaintenance;
  onUpdate: () => void;
  readOnly?: boolean;
}

const defaultChecklist: PMChecklistItem[] = [
  {
    id: '1',
    title: 'Visual Inspection',
    description: 'Check for visible damage, wear, or abnormalities',
    completed: false,
    required: true
  },
  {
    id: '2',
    title: 'Safety Systems Check',
    description: 'Verify all safety mechanisms are functioning properly',
    completed: false,
    required: true
  },
  {
    id: '3',
    title: 'Lubrication',
    description: 'Check and replenish lubricants as needed',
    completed: false,
    required: true
  },
  {
    id: '4',
    title: 'Electrical Connections',
    description: 'Inspect electrical connections and wiring',
    completed: false,
    required: true
  },
  {
    id: '5',
    title: 'Performance Test',
    description: 'Run equipment through standard performance tests',
    completed: false,
    required: true
  },
  {
    id: '6',
    title: 'Filter Replacement',
    description: 'Replace filters if due or contaminated',
    completed: false,
    required: false
  },
  {
    id: '7',
    title: 'Calibration Check',
    description: 'Verify equipment calibration is within acceptable ranges',
    completed: false,
    required: false
  },
  {
    id: '8',
    title: 'Documentation Update',
    description: 'Update maintenance logs and records',
    completed: false,
    required: true
  }
];

const PMChecklistComponent: React.FC<PMChecklistComponentProps> = ({
  pm,
  onUpdate,
  readOnly = false
}) => {
  const [checklist, setChecklist] = useState<PMChecklistItem[]>([]);
  const [notes, setNotes] = useState(pm.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Initialize checklist from PM data or use default
    try {
      const savedChecklist = pm.checklist_data;
      if (savedChecklist && Array.isArray(savedChecklist) && savedChecklist.length > 0) {
        // Type assertion with validation
        const parsedChecklist = savedChecklist as unknown as PMChecklistItem[];
        // Validate that the parsed data has the expected structure
        const isValidChecklist = parsedChecklist.every(item => 
          typeof item === 'object' && 
          item !== null && 
          'id' in item && 
          'title' in item && 
          'completed' in item && 
          'required' in item
        );
        
        if (isValidChecklist) {
          setChecklist(parsedChecklist);
        } else {
          setChecklist(defaultChecklist);
        }
      } else {
        setChecklist(defaultChecklist);
      }
    } catch (error) {
      console.error('Error parsing checklist data:', error);
      setChecklist(defaultChecklist);
    }
  }, [pm]);

  const handleChecklistItemChange = (itemId: string, completed: boolean, itemNotes?: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, completed, notes: itemNotes } 
        : item
    ));
  };

  const saveChanges = async () => {
    setIsUpdating(true);
    try {
      const updatedPM = await updatePM(pm.id, {
        checklistData: checklist,
        notes,
        status: pm.status === 'pending' ? 'in_progress' as const : pm.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
      });

      if (updatedPM) {
        toast.success('PM checklist updated successfully');
        onUpdate();
      } else {
        toast.error('Failed to update PM checklist');
      }
    } catch (error) {
      console.error('Error updating PM:', error);
      toast.error('Failed to update PM checklist');
    } finally {
      setIsUpdating(false);
    }
  };

  const completePM = async () => {
    const requiredItems = checklist.filter(item => item.required);
    const incompleteRequired = requiredItems.filter(item => !item.completed);

    if (incompleteRequired.length > 0) {
      toast.error(`Please complete all required items: ${incompleteRequired.map(item => item.title).join(', ')}`);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedPM = await updatePM(pm.id, {
        checklistData: checklist,
        notes,
        status: 'completed' as const
      });

      if (updatedPM) {
        toast.success('PM completed successfully');
        onUpdate();
      } else {
        toast.error('Failed to complete PM');
      }
    } catch (error) {
      console.error('Error completing PM:', error);
      toast.error('Failed to complete PM');
    } finally {
      setIsUpdating(false);
    }
  };

  const printPM = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Preventative Maintenance Checklist</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .checklist-item { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }
            .required { border-left: 4px solid #e74c3c; }
            .completed { background-color: #d5f4e6; }
            .checkbox { margin-right: 10px; }
            .notes { margin-top: 20px; padding: 15px; background-color: #f8f9fa; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Preventative Maintenance Checklist</h1>
            <p><strong>PM ID:</strong> ${pm.id}</p>
            <p><strong>Status:</strong> ${pm.status}</p>
            <p><strong>Created:</strong> ${new Date(pm.created_at).toLocaleDateString()}</p>
            ${pm.completed_at ? `<p><strong>Completed:</strong> ${new Date(pm.completed_at).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div class="checklist">
            ${checklist.map(item => `
              <div class="checklist-item ${item.required ? 'required' : ''} ${item.completed ? 'completed' : ''}">
                <div>
                  <input type="checkbox" class="checkbox" ${item.completed ? 'checked' : ''} disabled>
                  <strong>${item.title}</strong> ${item.required ? '(Required)' : '(Optional)'}
                </div>
                ${item.description ? `<p><em>${item.description}</em></p>` : ''}
                ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
              </div>
            `).join('')}
          </div>
          
          ${notes ? `
            <div class="notes">
              <h3>General Notes</h3>
              <p>${notes.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusIcon = () => {
    switch (pm.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (pm.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const requiredCount = checklist.filter(item => item.required).length;
  const completedRequired = checklist.filter(item => item.required && item.completed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>Preventative Maintenance Checklist</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor()}>
                  {pm.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{checklist.length} items completed
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={printPM}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pm.status !== 'completed' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Complete all required items ({completedRequired}/{requiredCount}) to finish this PM.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.id} className={`p-4 border rounded-lg ${item.required ? 'border-l-4 border-l-red-500' : ''}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => handleChecklistItemChange(item.id, checked as boolean)}
                  disabled={readOnly || pm.status === 'completed'}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    {item.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  {!readOnly && pm.status !== 'completed' && (
                    <Textarea
                      placeholder="Add notes for this item..."
                      value={item.notes || ''}
                      onChange={(e) => handleChecklistItemChange(item.id, item.completed, e.target.value)}
                      className="mt-2"
                      rows={2}
                    />
                  )}
                  {item.notes && (readOnly || pm.status === 'completed') && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Notes:</strong> {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">General Notes</label>
          <Textarea
            placeholder="Add general notes about this PM..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly || pm.status === 'completed'}
            rows={3}
          />
        </div>

        {!readOnly && pm.status !== 'completed' && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={saveChanges}
              disabled={isUpdating}
              variant="outline"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={completePM}
              disabled={isUpdating || completedRequired < requiredCount}
            >
              {isUpdating ? 'Completing...' : 'Complete PM'}
            </Button>
          </div>
        )}

        {pm.completed_at && (
          <div className="pt-4 border-t text-sm text-muted-foreground">
            Completed on {new Date(pm.completed_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PMChecklistComponent;
