import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Clock, AlertTriangle, Printer, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { PMChecklistItem, PreventativeMaintenance, updatePM, defaultForkliftChecklist } from '@/services/preventativeMaintenanceService';
import { toast } from 'sonner';

interface PMChecklistComponentProps {
  pm: PreventativeMaintenance;
  onUpdate: () => void;
  readOnly?: boolean;
}

const PMChecklistComponent: React.FC<PMChecklistComponentProps> = ({
  pm,
  onUpdate,
  readOnly = false
}) => {
  const [checklist, setChecklist] = useState<PMChecklistItem[]>([]);
  const [notes, setNotes] = useState(pm.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize checklist from PM data or use default forklift checklist
    try {
      const savedChecklist = pm.checklist_data;
      console.log('🔧 PM Checklist Data:', savedChecklist);
      
      if (savedChecklist && Array.isArray(savedChecklist) && savedChecklist.length > 0) {
        // Type assertion with validation
        const parsedChecklist = savedChecklist as unknown as PMChecklistItem[];
        // Validate that the parsed data has the expected structure
        const isValidChecklist = parsedChecklist.every(item => 
          typeof item === 'object' && 
          item !== null && 
          'id' in item && 
          'title' in item && 
          'condition' in item && 
          'required' in item &&
          'section' in item
        );
        
        if (isValidChecklist) {
          console.log('✅ Using saved checklist data');
          setChecklist(parsedChecklist);
        } else {
          console.log('⚠️ Invalid checklist data, using default');
          setChecklist(defaultForkliftChecklist);
        }
      } else {
        console.log('🔧 No checklist data found, using default forklift checklist');
        setChecklist(defaultForkliftChecklist);
        
        // Auto-save the default checklist if this is a new PM
        if (!readOnly) {
          handleInitializeChecklist();
        }
      }
    } catch (error) {
      console.error('❌ Error parsing checklist data:', error);
      setChecklist(defaultForkliftChecklist);
      
      // Auto-save the default checklist on error
      if (!readOnly) {
        handleInitializeChecklist();
      }
    }

    // Initialize all sections as open
    const sections = Array.from(new Set(defaultForkliftChecklist.map(item => item.section)));
    const initialOpenSections: Record<string, boolean> = {};
    sections.forEach(section => {
      initialOpenSections[section] = true;
    });
    setOpenSections(initialOpenSections);
  }, [pm, readOnly]);

  const handleInitializeChecklist = async () => {
    console.log('🔧 Initializing checklist with default data');
    try {
      const updatedPM = await updatePM(pm.id, {
        checklistData: defaultForkliftChecklist,
        notes: notes || 'PM checklist initialized with default forklift maintenance items.',
        status: pm.status === 'pending' ? 'in_progress' as const : pm.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
      });

      if (updatedPM) {
        console.log('✅ Checklist initialized successfully');
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Error initializing checklist:', error);
    }
  };

  const handleChecklistItemChange = (itemId: string, condition: 1 | 2 | 3 | 4 | 5, itemNotes?: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, condition, notes: itemNotes } 
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
    const poorConditionItems = requiredItems.filter(item => item.condition <= 2);

    if (poorConditionItems.length > 0) {
      toast.error(`Address poor condition items before completing: ${poorConditionItems.map(item => item.title).join(', ')}`);
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

    const sections = Array.from(new Set(checklist.map(item => item.section)));
    const getConditionText = (condition: number) => {
      switch (condition) {
        case 1: return 'Poor';
        case 2: return 'Fair';
        case 3: return 'Good';
        case 4: return 'Very Good';
        case 5: return 'Excellent';
        default: return 'Unknown';
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Forklift Preventative Maintenance Checklist</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; padding: 10px; background-color: #f0f0f0; }
            .checklist-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            .required { border-left: 4px solid #e74c3c; }
            .condition { font-weight: bold; }
            .condition-1, .condition-2 { color: #e74c3c; }
            .condition-3 { color: #f39c12; }
            .condition-4, .condition-5 { color: #27ae60; }
            .notes { margin-top: 20px; padding: 15px; background-color: #f8f9fa; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Forklift Preventative Maintenance Checklist</h1>
            <p><strong>PM ID:</strong> ${pm.id}</p>
            <p><strong>Status:</strong> ${pm.status}</p>
            <p><strong>Created:</strong> ${new Date(pm.created_at).toLocaleDateString()}</p>
            ${pm.completed_at ? `<p><strong>Completed:</strong> ${new Date(pm.completed_at).toLocaleDateString()}</p>` : ''}
          </div>
          
          ${sections.map(section => `
            <div class="section">
              <div class="section-title">${section}</div>
              ${checklist.filter(item => item.section === section).map(item => `
                <div class="checklist-item ${item.required ? 'required' : ''}">
                  <div>
                    <strong>${item.title}</strong> ${item.required ? '(Required)' : '(Optional)'}
                    <span class="condition condition-${item.condition}"> - Condition: ${getConditionText(item.condition)}</span>
                  </div>
                  ${item.description ? `<p><em>${item.description}</em></p>` : ''}
                  ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
          
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

  const getConditionColor = (condition: number) => {
    switch (condition) {
      case 1:
      case 2:
        return 'text-red-600';
      case 3:
        return 'text-yellow-600';
      case 4:
      case 5:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConditionText = (condition: number) => {
    switch (condition) {
      case 1: return 'Poor';
      case 2: return 'Fair'; 
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Unknown';
    }
  };

  const sections = Array.from(new Set(checklist.map(item => item.section)));
  const averageCondition = checklist.length > 0 ? checklist.reduce((sum, item) => sum + item.condition, 0) / checklist.length : 5;
  const poorConditionCount = checklist.filter(item => item.condition <= 2).length;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Show empty state if checklist is empty
  if (checklist.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle>Forklift Preventative Maintenance Checklist</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor()}>
                    {pm.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              PM checklist is empty. Initialize it with the default forklift maintenance checklist.
            </AlertDescription>
          </Alert>
          {!readOnly && (
            <Button 
              onClick={handleInitializeChecklist}
              disabled={isUpdating}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isUpdating ? 'Initializing...' : 'Initialize Default Checklist'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>Forklift Preventative Maintenance Checklist</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor()}>
                  {pm.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Average Condition: <span className={getConditionColor(Math.round(averageCondition))}>
                    {getConditionText(Math.round(averageCondition))}
                  </span>
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
        {pm.status !== 'completed' && poorConditionCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {poorConditionCount} item(s) in poor condition require attention before completion.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {sections.map((section) => (
            <Collapsible key={section} open={openSections[section]} onOpenChange={() => toggleSection(section)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <span className="font-semibold text-left">{section}</span>
                  {openSections[section] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {checklist.filter(item => item.section === section).map((item) => (
                  <div key={item.id} className={`p-4 border rounded-lg ${item.required ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <span className={`text-sm font-medium ${getConditionColor(item.condition)}`}>
                          {getConditionText(item.condition)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      
                      {!readOnly && pm.status !== 'completed' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Condition Rating:</Label>
                          <RadioGroup
                            value={item.condition.toString()}
                            onValueChange={(value) => handleChecklistItemChange(item.id, parseInt(value) as 1 | 2 | 3 | 4 | 5)}
                            className="flex gap-4"
                          >
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <div key={rating} className="flex items-center space-x-2">
                                <RadioGroupItem value={rating.toString()} id={`${item.id}-${rating}`} />
                                <Label htmlFor={`${item.id}-${rating}`} className={`text-sm ${getConditionColor(rating)}`}>
                                  {rating} - {getConditionText(rating)}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}

                      {!readOnly && pm.status !== 'completed' && (
                        <Textarea
                          placeholder="Add notes for this item..."
                          value={item.notes || ''}
                          onChange={(e) => handleChecklistItemChange(item.id, item.condition, e.target.value)}
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
                ))}
              </CollapsibleContent>
            </Collapsible>
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
              disabled={isUpdating || poorConditionCount > 0}
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
