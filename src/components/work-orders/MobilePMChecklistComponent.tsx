
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clipboard, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Star,
  MessageSquare
} from 'lucide-react';
import { PreventativeMaintenance, PMChecklistItem, updatePM } from '@/services/preventativeMaintenanceService';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

interface MobilePMChecklistComponentProps {
  pm: PreventativeMaintenance;
  onUpdate: () => void;
  readOnly?: boolean;
}

const MobilePMChecklistComponent: React.FC<MobilePMChecklistComponentProps> = ({
  pm,
  onUpdate,
  readOnly = false
}) => {
  const isMobile = useIsMobile();
  const [checklistItems, setChecklistItems] = useState<PMChecklistItem[]>([]);
  const [notes, setNotes] = useState(pm.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    if (pm.checklist_data) {
      // Properly handle the JSON data conversion with type safety
      try {
        const items = Array.isArray(pm.checklist_data) 
          ? (pm.checklist_data as unknown as PMChecklistItem[])
          : [];
        setChecklistItems(items);
      } catch (error) {
        console.error('Error parsing checklist data:', error);
        setChecklistItems([]);
      }
    }
  }, [pm.checklist_data]);

  // Group items by section
  const groupedItems = checklistItems.reduce((acc, item) => {
    const section = item.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, PMChecklistItem[]>);

  const getSectionStats = (items: PMChecklistItem[]) => {
    const total = items.length;
    const completed = items.filter(item => item.condition !== undefined && item.condition !== null).length;
    const failed = items.filter(item => item.condition === 1 || item.condition === 2).length;
    
    return { total, completed, failed };
  };

  const getSectionBadgeVariant = (items: PMChecklistItem[]) => {
    const { total, completed, failed } = getSectionStats(items);
    
    if (failed > 0) return 'destructive';
    if (completed === total) return 'default';
    return 'secondary';
  };

  const getSectionIcon = (items: PMChecklistItem[]) => {
    const { total, completed, failed } = getSectionStats(items);
    
    if (failed > 0) return AlertTriangle;
    if (completed === total) return CheckCircle;
    return Clipboard;
  };

  const handleConditionChange = (itemId: string, condition: 1 | 2 | 3 | 4 | 5) => {
    if (readOnly) return;
    
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, condition }
          : item
      )
    );
  };

  const handleNotesChange = (itemId: string, itemNotes: string) => {
    if (readOnly) return;
    
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, notes: itemNotes }
          : item
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const allItemsRated = checklistItems.every(item => 
        !item.required || (item.condition !== undefined && item.condition !== null)
      );

      const status = allItemsRated ? 'completed' : 'in_progress';
      
      await updatePM(pm.id, {
        checklistData: checklistItems,
        notes,
        status
      });
      
      toast({
        title: 'PM Checklist Updated',
        description: allItemsRated ? 'All required items completed!' : 'Progress saved successfully',
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating PM:', error);
      toast({
        title: 'Error',
        description: 'Failed to update PM checklist',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConditionRating = (item: PMChecklistItem) => {
    const conditions = [
      { value: 1, label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' },
      { value: 2, label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100 border-orange-300' },
      { value: 3, label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-300' },
      { value: 4, label: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-300' },
      { value: 5, label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300' }
    ];

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Condition Rating:</div>
        <div className="grid grid-cols-5 gap-1">
          {conditions.map(({ value, label, color, bgColor }) => (
            <Button
              key={value}
              variant={item.condition === value ? 'default' : 'outline'}
              size="sm"
              className={`text-xs p-2 h-auto flex-col ${
                item.condition === value 
                  ? `${bgColor} ${color} border-2` 
                  : 'hover:' + bgColor
              }`}
              onClick={() => handleConditionChange(item.id, value as 1 | 2 | 3 | 4 | 5)}
              disabled={readOnly}
            >
              <Star className="h-3 w-3 mb-1" />
              <span className="text-xs">{value}</span>
            </Button>
          ))}
        </div>
        {item.condition && (
          <div className={`text-xs font-medium ${conditions.find(c => c.value === item.condition)?.color}`}>
            {conditions.find(c => c.value === item.condition)?.label}
          </div>
        )}
      </div>
    );
  };

  const allRequiredItemsCompleted = checklistItems.every(item => 
    !item.required || (item.condition !== undefined && item.condition !== null)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            <span className="text-base sm:text-lg">PM Checklist</span>
          </div>
          <Badge className={
            pm.status === 'completed' ? 'bg-green-100 text-green-800' :
            pm.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }>
            {pm.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allRequiredItemsCompleted && pm.status !== 'completed' && !readOnly && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              All required items completed! Save to mark PM as complete.
            </AlertDescription>
          </Alert>
        )}

        <Accordion 
          type="multiple" 
          value={openSections} 
          onValueChange={setOpenSections}
          className="space-y-2"
        >
          {Object.entries(groupedItems).map(([sectionName, items]) => {
            const { total, completed, failed } = getSectionStats(items);
            const SectionIcon = getSectionIcon(items);
            
            return (
              <AccordionItem key={sectionName} value={sectionName} className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <SectionIcon className="h-4 w-4" />
                      <span className="font-medium text-sm sm:text-base">{sectionName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSectionBadgeVariant(items)} className="text-xs">
                        {completed}/{total}
                      </Badge>
                      {failed > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {failed} issues
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.required && (
                            <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
                          )}
                        </div>

                        {renderConditionRating(item)}

                        {/* Notes Field */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Notes
                          </Label>
                          <Textarea
                            placeholder="Add notes about this item..."
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.id, e.target.value)}
                            disabled={readOnly}
                            className="text-xs min-h-[60px] resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {!readOnly && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="w-full"
              size={isMobile ? "default" : "sm"}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobilePMChecklistComponent;
