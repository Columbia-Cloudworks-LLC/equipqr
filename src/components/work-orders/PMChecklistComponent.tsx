import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronRight, RefreshCw, Circle, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SegmentedProgress } from '@/components/ui/segmented-progress';
import { createSegmentsForSection } from '@/utils/pmChecklistHelpers';
import { PMChecklistItem, PreventativeMaintenance, updatePM, defaultForkliftChecklist } from '@/services/preventativeMaintenanceService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useBrowserStorage } from '@/hooks/useBrowserStorage';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { toast } from 'sonner';
import PrintExportDropdown from './PrintExportDropdown';
import { PMChecklistPDFGenerator } from '@/utils/pdfGenerator';
import { workOrderRevertService } from '@/services/workOrderRevertService';

interface PMChecklistComponentProps {
  pm: PreventativeMaintenance;
  onUpdate: () => void;
  readOnly?: boolean;
  isAdmin?: boolean;
  workOrder?: any;
  equipment?: any;
  team?: any;
  organization?: any;
  assignee?: any;
}

const PMChecklistComponent: React.FC<PMChecklistComponentProps> = ({
  pm,
  onUpdate,
  readOnly = false,
  isAdmin = false,
  workOrder,
  equipment,
  team,
  organization,
  assignee
}) => {
  const isMobile = useIsMobile();
  const [checklist, setChecklist] = useState<PMChecklistItem[]>([]);
  const [notes, setNotes] = useState(pm.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'offline'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSetAllOKDialog, setShowSetAllOKDialog] = useState(false);
  const [isSettingAllOK, setIsSettingAllOK] = useState(false);

  // Browser storage for backup
  const storageKey = `pm-checklist-${pm.id}`;
  const { saveToStorage, loadFromStorage, clearStorage } = useBrowserStorage({
    key: storageKey,
    data: { checklist, notes },
    enabled: !readOnly
  });

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (readOnly || !hasUnsavedChanges) return;
    
    try {
      setSaveStatus('saving');
      await updatePM(pm.id, {
        checklistData: checklist,
        notes,
        status: pm.status === 'pending' ? 'in_progress' as const : pm.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
      });
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      clearStorage(); // Clear backup after successful save
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [pm.id, checklist, notes, pm.status, readOnly, hasUnsavedChanges, clearStorage]);

  const { triggerAutoSave, cancelAutoSave } = useAutoSave({
    onSave: handleAutoSave,
    selectionDelay: 3000,
    enabled: !readOnly && hasUnsavedChanges
  });

  useEffect(() => {
    // Only initialize once to prevent unnecessary resets
    if (isInitialized) return;

    // Reduced logging for performance
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Initializing PM Checklist:', pm.id);
    }

    try {
      let parsedChecklist: PMChecklistItem[] = [];
      
      // Improved validation and parsing logic
      if (pm.checklist_data && Array.isArray(pm.checklist_data) && pm.checklist_data.length > 0) {
        // Validate that the array contains valid checklist items
        const isValidChecklistData = pm.checklist_data.every((item: any) => {
          return (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            typeof item.section === 'string' &&
            typeof item.required === 'boolean' &&
            (item.condition === null || item.condition === undefined || 
             (typeof item.condition === 'number' && item.condition >= 1 && item.condition <= 5))
          );
        });

        if (isValidChecklistData) {
          // Cast the data with proper type assertion
          parsedChecklist = pm.checklist_data.map((item: any) => ({
            id: String(item.id),
            title: String(item.title),
            description: item.description ? String(item.description) : undefined,
            section: String(item.section),
            required: Boolean(item.required),
            condition: item.condition !== null && item.condition !== undefined ? Number(item.condition) as 1 | 2 | 3 | 4 | 5 : null,
            notes: item.notes ? String(item.notes) : undefined
          }));
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Using saved checklist data:', parsedChecklist.length, 'items');
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ Saved checklist data is invalid, using default');
          }
          parsedChecklist = [...defaultForkliftChecklist];
        }
      } else {
        // Try to load from browser storage first
        const storedData = loadFromStorage();
        if (storedData && storedData.checklist && Array.isArray(storedData.checklist)) {
          parsedChecklist = storedData.checklist;
          setNotes(storedData.notes || '');
          if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Loaded from browser storage');
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Using default forklift checklist');
          }
          parsedChecklist = [...defaultForkliftChecklist];
        }
      }

      setChecklist(parsedChecklist);

      // Initialize all sections as collapsed by default
      const sections = Array.from(new Set(parsedChecklist.map(item => item.section)));
      const initialOpenSections: Record<string, boolean> = {};
      sections.forEach(section => {
        initialOpenSections[section] = false; // All sections collapsed by default
      });
      setOpenSections(initialOpenSections);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error parsing checklist data:', error);
      setChecklist([...defaultForkliftChecklist]);
      
      // Initialize sections for default checklist (all collapsed)
      const sections = Array.from(new Set(defaultForkliftChecklist.map(item => item.section)));
      const initialOpenSections: Record<string, boolean> = {};
      sections.forEach(section => {
        initialOpenSections[section] = false; // All sections collapsed by default
      });
      setOpenSections(initialOpenSections);
      
      setIsInitialized(true);
    }
  }, [pm.checklist_data, pm.id, isMobile, isInitialized, loadFromStorage]);

  const handleInitializeChecklist = useCallback(async () => {
    try {
      setIsUpdating(true);
      const updatedPM = await updatePM(pm.id, {
        checklistData: defaultForkliftChecklist,
        notes: notes || 'PM checklist initialized with default forklift maintenance items.',
        status: pm.status === 'pending' ? 'in_progress' as const : pm.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
      });

      if (updatedPM) {
        toast.success('Checklist initialized successfully');
        setChecklist([...defaultForkliftChecklist]);
        setHasUnsavedChanges(false);
        clearStorage();
        onUpdate();
      } else {
        toast.error('Failed to initialize checklist');
      }
    } catch (error) {
      console.error('❌ Error initializing checklist:', error);
      toast.error('Failed to initialize checklist');
    } finally {
      setIsUpdating(false);
    }
  }, [pm.id, notes, pm.status, onUpdate, clearStorage]);

  const handleChecklistItemChange = useCallback((itemId: string, condition: 1 | 2 | 3 | 4 | 5) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, condition } 
        : item
    ));
    setHasUnsavedChanges(true);
    triggerAutoSave('selection'); // Use selection trigger for immediate UI changes
  }, [triggerAutoSave]);

  const handleNotesItemChange = useCallback((itemId: string, notes: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, notes } 
        : item
    ));
    setHasUnsavedChanges(true);
    triggerAutoSave('text'); // Use text trigger for longer debounce
  }, [triggerAutoSave]);

  const isItemComplete = (item: PMChecklistItem): boolean => {
    return item.condition !== null && item.condition !== undefined;
  };

  const saveChanges = useCallback(async () => {
    setIsUpdating(true);
    cancelAutoSave(); // Cancel any pending auto-save
    
    try {
      setSaveStatus('saving');
      const updatedPM = await updatePM(pm.id, {
        checklistData: checklist,
        notes,
        status: pm.status === 'pending' ? 'in_progress' as const : pm.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
      });

      if (updatedPM) {
        toast.success('PM checklist updated successfully');
        setSaveStatus('saved');
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        clearStorage();
        onUpdate();
      } else {
        setSaveStatus('error');
        toast.error('Failed to update PM checklist');
      }
    } catch (error) {
      console.error('❌ Error updating PM:', error);
      setSaveStatus('error');
      toast.error('Failed to update PM checklist');
    } finally {
      setIsUpdating(false);
    }
  }, [pm.id, checklist, notes, pm.status, onUpdate, cancelAutoSave, clearStorage]);

  const completePM = async () => {
    const requiredItems = checklist.filter(item => item.required);
    const unratedRequiredItems = requiredItems.filter(item => !isItemComplete(item));
    const unsafeItems = checklist.filter(item => item.condition === 5);

    if (unratedRequiredItems.length > 0) {
      toast.error(`Please rate all required items before completing: ${unratedRequiredItems.map(item => item.title).join(', ')}`);
      return;
    }

    if (unsafeItems.length > 0) {
      toast.error(`Address unsafe conditions before completing: ${unsafeItems.map(item => item.title).join(', ')}`);
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

  const revertPMCompletion = async () => {
    setIsReverting(true);
    try {
      const result = await workOrderRevertService.revertPMCompletion(
        pm.id,
        'PM completion reverted by admin'
      );
      
      if (result.success) {
        toast.success(`PM status reverted from ${result.old_status} to ${result.new_status}`);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to revert PM completion');
      }
    } catch (error) {
      console.error('Error reverting PM completion:', error);
      toast.error('Failed to revert PM completion');
    } finally {
      setIsReverting(false);
    }
  };

  const handleSetAllToOK = useCallback(async () => {
    setIsSettingAllOK(true);
    try {
      const updatedChecklist = checklist.map(item => ({
        ...item,
        condition: 1 as const // Set to "OK" while preserving notes and other properties
      }));
      
      // Save directly to database instead of relying on auto-save
      const result = await updatePM(pm.id, {
        checklistData: updatedChecklist,
        notes: notes
      });

      if (result) {
        setChecklist(updatedChecklist);
        setHasUnsavedChanges(false);
        // Clear backup since we've saved successfully
        localStorage.removeItem(storageKey);
        
        toast.success('All items set to OK and PM saved successfully');
        setShowSetAllOKDialog(false);
        
        // Update parent component
        onUpdate();
      } else {
        throw new Error('Failed to update PM');
      }
    } catch (error) {
      console.error('Error setting all items to OK and saving:', error);
      toast.error('Failed to set all items to OK and save PM');
    } finally {
      setIsSettingAllOK(false);
    }
  }, [checklist, notes, pm.id, onUpdate, storageKey]);

  // Print/Export handlers
  const handlePrintPDF = useCallback(() => {
    try {
      PMChecklistPDFGenerator.generateAndPrint(pm, checklist, {
        includeProgress: true,
        includeNotes: true,
        includeTimestamps: true
      });
      toast.success('PDF generated for printing');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  }, [pm, checklist]);

  const handleDownloadPDF = useCallback(() => {
    try {
      PMChecklistPDFGenerator.generateAndDownload(pm, checklist, {
        includeProgress: false,
        includeNotes: true,
        includeTimestamps: true,
        workOrder,
        equipment,
        team,
        organization,
        assignee
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  }, [pm, checklist, workOrder, equipment, team, organization, assignee]);

  const handleBrowserPrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sections = Array.from(new Set(checklist.map(item => item.section)));
    const getConditionText = (condition: number | null | undefined) => {
      if (condition === null || condition === undefined) return 'Not Rated';
      switch (condition) {
        case 1: return 'OK';
        case 2: return 'Adjusted';
        case 3: return 'Recommend Repairs';
        case 4: return 'Requires Immediate Repairs';
        case 5: return 'Unsafe Condition Present';
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
            .condition-unrated { color: #e74c3c; }
            .condition-1 { color: #27ae60; }
            .condition-2 { color: #f39c12; }
            .condition-3 { color: #e67e22; }
            .condition-4 { color: #e74c3c; }
            .condition-5 { color: #c0392b; }
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
                    <span class="condition condition-${item.condition || 'unrated'}"> - ${getConditionText(item.condition)}</span>
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
  }, [pm, checklist, notes]);

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

  const getConditionColor = (condition: number | null | undefined) => {
    if (condition === null || condition === undefined) return 'text-red-600';
    switch (condition) {
      case 1:
        return 'text-green-600';
      case 2:
        return 'text-yellow-600';
      case 3:
        return 'text-orange-600';
      case 4:
        return 'text-red-600';
      case 5:
        return 'text-red-800';
      default:
        return 'text-gray-600';
    }
  };

  const getConditionText = (condition: number | null | undefined) => {
    if (condition === null || condition === undefined) return 'Not Rated';
    switch (condition) {
      case 1: return 'OK';
      case 2: return 'Adjusted';
      case 3: return 'Recommend Repairs';
      case 4: return 'Requires Immediate Repairs';
      case 5: return 'Unsafe Condition Present';
      default: return 'Unknown';
    }
  };

  // Memoize expensive calculations
  const sections = useMemo(() => Array.from(new Set(checklist.map(item => item.section))), [checklist]);
  const completedItems = useMemo(() => checklist.filter(item => isItemComplete(item)), [checklist]);
  const totalItems = checklist.length;
  const unratedRequiredItems = useMemo(() => checklist.filter(item => item.required && !isItemComplete(item)), [checklist]);
  const unsafeItems = useMemo(() => checklist.filter(item => item.condition === 5), [checklist]);

  // Calculate section progress
  const getSectionProgress = useCallback((section: string) => {
    const sectionItems = checklist.filter(item => item.section === section);
    const completedSectionItems = sectionItems.filter(item => isItemComplete(item));
    return {
      completed: completedSectionItems.length,
      total: sectionItems.length,
      percentage: sectionItems.length > 0 ? (completedSectionItems.length / sectionItems.length) * 100 : 0
    };
  }, [checklist]);

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Helper function to get border styling based on item state
  const getItemBorderClass = useCallback((item: PMChecklistItem) => {
    const isComplete = isItemComplete(item);
    if (isComplete) {
      return 'border-l-4 border-l-green-500'; // Green border for completed items
    } else if (item.required) {
      return 'border-l-4 border-l-red-500'; // Red border for required unrated items
    }
    return ''; // No colored border for optional unrated items
  }, []);

  // Handle notes changes with auto-save for text input
  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    setHasUnsavedChanges(true);
    triggerAutoSave('text'); // Use text trigger for longer debounce
  }, [triggerAutoSave]);

  // Show empty state if checklist is empty and not initialized
  if (checklist.length === 0 && !isInitialized) {
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
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Show initialization option if checklist is empty but initialized
  if (checklist.length === 0 && isInitialized) {
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
        {isMobile ? (
          // Mobile: Multi-row layout with stacked elements
          <div className="space-y-4">
            {/* Title and Print Action Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getStatusIcon()}
                <CardTitle className="text-lg leading-tight">
                  Forklift Preventative Maintenance Checklist
                </CardTitle>
              </div>
              <PrintExportDropdown
                onDownloadPDF={handleDownloadPDF}
                disabled={isUpdating}
              />
            </div>
            
            {/* Status and Progress Row */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor()}>
                  {pm.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {!readOnly && (
                  <SaveStatus 
                    status={saveStatus} 
                    lastSaved={lastSaved}
                  />
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                Progress: {completedItems.length}/{totalItems} items completed
              </span>
            </div>
          </div>
        ) : (
          // Desktop: Horizontal layout
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
                    Progress: {completedItems.length}/{totalItems} items completed
                  </span>
                  {!readOnly && (
                    <SaveStatus 
                      status={saveStatus} 
                      lastSaved={lastSaved}
                      className="ml-2"
                    />
                  )}
                </div>
              </div>
            </div>
            <PrintExportDropdown
              onDownloadPDF={handleDownloadPDF}
              disabled={isUpdating}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {pm.status !== 'completed' && unratedRequiredItems.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {unratedRequiredItems.length} required item(s) need to be rated before completion.
              {!readOnly && (
                <>
                  {' '}
                  <button 
                    onClick={() => setShowSetAllOKDialog(true)}
                    className="text-red-800 underline hover:no-underline focus:outline-none"
                    disabled={isSettingAllOK}
                  >
                    Set All to OK
                  </button>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {pm.status !== 'completed' && unsafeItems.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {unsafeItems.length} item(s) marked as unsafe condition present require immediate attention.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {sections.map((section) => {
            const sectionProgress = getSectionProgress(section);
            const sectionItems = checklist.filter(item => item.section === section);
            const segments = createSegmentsForSection(sectionItems);
            
            return (
              <Collapsible key={section} open={openSections[section]} onOpenChange={() => toggleSection(section)}>
                <CollapsibleTrigger asChild>
                  <div className="relative overflow-hidden rounded-lg border">
                    <SegmentedProgress 
                      segments={segments}
                      className="absolute inset-0 h-full opacity-30"
                    />
                    <Button variant="ghost" className="relative w-full justify-between p-4 h-auto bg-transparent hover:bg-white/50">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-left">{section}</span>
                        <span className="text-xs text-muted-foreground">
                          {sectionProgress.completed}/{sectionProgress.total} items completed ({Math.round(sectionProgress.percentage)}%)
                        </span>
                      </div>
                      {openSections[section] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {checklist.filter(item => item.section === section).map((item) => (
                  <div key={item.id} className={`p-4 border rounded-lg ${getItemBorderClass(item)}`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          {isItemComplete(item) ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <span className={`text-sm font-medium ${getConditionColor(item.condition)}`}>
                          {getConditionText(item.condition)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      
                      {!readOnly && pm.status !== 'completed' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Maintenance Assessment:</Label>
                          <RadioGroup
                            value={item.condition?.toString() || ''}
                            onValueChange={(value) => handleChecklistItemChange(item.id, parseInt(value) as 1 | 2 | 3 | 4 | 5)}
                            className="flex flex-col gap-2"
                          >
                            {[
                              { value: 1, label: 'OK', color: 'text-green-600' },
                              { value: 2, label: 'Adjusted', color: 'text-yellow-600' },
                              { value: 3, label: 'Recommend Repairs', color: 'text-orange-600' },
                              { value: 4, label: 'Requires Immediate Repairs', color: 'text-red-600' },
                              { value: 5, label: 'Unsafe Condition Present', color: 'text-red-800' }
                            ].map((rating) => (
                              <div key={rating.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={rating.value.toString()} id={`${item.id}-${rating.value}`} />
                                <Label htmlFor={`${item.id}-${rating.value}`} className={`text-sm ${rating.color}`}>
                                  {rating.label}
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
                          onChange={(e) => handleNotesItemChange(item.id, e.target.value)}
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
            );
          })}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">General Notes</label>
          <Textarea
            placeholder="Add general notes about this PM..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
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
              disabled={isUpdating || unratedRequiredItems.length > 0 || unsafeItems.length > 0}
            >
              {isUpdating ? 'Completing...' : 'Complete PM'}
            </Button>
          </div>
        )}

        {/* Admin Revert Option for Completed PM */}
        {isAdmin && pm.status === 'completed' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={revertPMCompletion}
              disabled={isReverting}
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isReverting ? 'Reverting...' : 'Revert Completion'}
            </Button>
          </div>
        )}

        {pm.completed_at && (
          <div className="pt-4 border-t text-sm text-muted-foreground">
            Completed on {new Date(pm.completed_at).toLocaleString()}
          </div>
        )}

        {/* Set All to OK Confirmation Dialog */}
        <AlertDialog open={showSetAllOKDialog} onOpenChange={setShowSetAllOKDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set All Items to OK?</AlertDialogTitle>
              <AlertDialogDescription>
                This will set the condition of all checklist items to "OK". Any existing notes on the items will be preserved. 
                This action is useful when the equipment is already in good working order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSettingAllOK}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSetAllToOK}
                disabled={isSettingAllOK}
              >
                {isSettingAllOK ? 'Setting & Saving...' : 'Set All to OK & Save'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default PMChecklistComponent;
