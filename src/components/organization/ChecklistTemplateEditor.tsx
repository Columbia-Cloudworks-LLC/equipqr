import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown,
  Save,
  X
} from 'lucide-react';
import { PMChecklistItem } from '@/services/preventativeMaintenanceService';
import { useCreatePMTemplate, useUpdatePMTemplate } from '@/hooks/usePMTemplates';
import { nanoid } from 'nanoid';

interface ChecklistTemplateEditorProps {
  template?: {
    id: string;
    name: string;
    description?: string | null;
    template_data: PMChecklistItem[];
  } | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ChecklistTemplateEditor: React.FC<ChecklistTemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [checklistItems, setChecklistItems] = useState<PMChecklistItem[]>(template?.template_data || []);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const createMutation = useCreatePMTemplate();
  const updateMutation = useUpdatePMTemplate();

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setChecklistItems(template.template_data);
      
      // Auto-expand all sections
      const sections = new Set(template.template_data.map(item => item.section));
      setExpandedSections(sections);
    }
  }, [template]);

  // Group items by section
  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, PMChecklistItem[]>);

  const sections = Object.keys(groupedItems);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addSection = () => {
    const sectionName = prompt('Enter section name:');
    if (sectionName && !sections.includes(sectionName)) {
      // Add a default item to the new section
      const newItem: PMChecklistItem = {
        id: nanoid(),
        title: 'New item',
        description: '',
        section: sectionName,
        condition: null,
        required: false,
        notes: ''
      };
      setChecklistItems([...checklistItems, newItem]);
      setExpandedSections(prev => new Set([...prev, sectionName]));
    }
  };

  const renameSection = (oldName: string) => {
    const newName = prompt('Enter new section name:', oldName);
    if (newName && newName !== oldName && !sections.includes(newName)) {
      const updatedItems = checklistItems.map(item => 
        item.section === oldName ? { ...item, section: newName } : item
      );
      setChecklistItems(updatedItems);
      
      // Update expanded sections
      const newExpanded = new Set(expandedSections);
      if (newExpanded.has(oldName)) {
        newExpanded.delete(oldName);
        newExpanded.add(newName);
      }
      setExpandedSections(newExpanded);
    }
  };

  const deleteSection = (sectionName: string) => {
    const sectionItems = groupedItems[sectionName];
    if (sectionItems.length > 0) {
      if (!confirm(`Delete section "${sectionName}" and all ${sectionItems.length} items?`)) {
        return;
      }
    }
    
    const updatedItems = checklistItems.filter(item => item.section !== sectionName);
    setChecklistItems(updatedItems);
    
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(sectionName);
    setExpandedSections(newExpanded);
  };

  const addItem = (section: string) => {
    const newItem: PMChecklistItem = {
      id: nanoid(),
      title: 'New item',
      description: '',
      section,
      condition: null,
      required: false,
      notes: ''
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  const updateItem = (itemId: string, updates: Partial<PMChecklistItem>) => {
    const updatedItems = checklistItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setChecklistItems(updatedItems);
  };

  const deleteItem = (itemId: string) => {
    const updatedItems = checklistItems.filter(item => item.id !== itemId);
    setChecklistItems(updatedItems);
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;

    const sectionItems = groupedItems[item.section];
    const itemIndex = sectionItems.findIndex(i => i.id === itemId);
    
    if (direction === 'up' && itemIndex > 0) {
      const targetItem = sectionItems[itemIndex - 1];
      // Swap positions in the main array
      const newItems = [...checklistItems];
      const itemIndexInMain = newItems.findIndex(i => i.id === itemId);
      const targetIndexInMain = newItems.findIndex(i => i.id === targetItem.id);
      [newItems[itemIndexInMain], newItems[targetIndexInMain]] = [newItems[targetIndexInMain], newItems[itemIndexInMain]];
      setChecklistItems(newItems);
    } else if (direction === 'down' && itemIndex < sectionItems.length - 1) {
      const targetItem = sectionItems[itemIndex + 1];
      // Swap positions in the main array
      const newItems = [...checklistItems];
      const itemIndexInMain = newItems.findIndex(i => i.id === itemId);
      const targetIndexInMain = newItems.findIndex(i => i.id === targetItem.id);
      [newItems[itemIndexInMain], newItems[targetIndexInMain]] = [newItems[targetIndexInMain], newItems[itemIndexInMain]];
      setChecklistItems(newItems);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Template name is required');
      return;
    }

    if (checklistItems.length === 0) {
      alert('Template must have at least one item');
      return;
    }

    if (sections.length === 0) {
      alert('Template must have at least one section');
      return;
    }

    try {
      if (template) {
        // Update existing template
        await updateMutation.mutateAsync({
          templateId: template.id,
          updates: {
            name: templateName,
            description: templateDescription,
            template_data: checklistItems
          }
        });
      } else {
        // Create new template
        await createMutation.mutateAsync({
          name: templateName,
          description: templateDescription,
          template_data: checklistItems
        });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
          />
        </div>
        <div>
          <Label htmlFor="templateDescription">Description (Optional)</Label>
          <Textarea
            id="templateDescription"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Enter template description"
            rows={2}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Checklist Sections</h3>
          <Button onClick={addSection} size="sm">
            <Plus className="mr-1 h-3 w-3" />
            Add Section
          </Button>
        </div>

        {sections.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-muted-foreground">
              No sections yet. Add a section to get started.
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {sections.map(section => {
              const sectionItems = groupedItems[section];
              const isExpanded = expandedSections.has(section);
              
              return (
                <Card key={section}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleSection(section)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span>{section}</span>
                            <Badge variant="outline">{sectionItems.length} items</Badge>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => renameSection(section)}
                            >
                              Rename
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteSection(section)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        {sectionItems.map((item, index) => (
                          <div key={item.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    placeholder="Item title"
                                  />
                                </div>
                                <div>
                                  <Label>Description (Optional)</Label>
                                  <Textarea
                                    value={item.description || ''}
                                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                    placeholder="Item description"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`required-${item.id}`}
                                    checked={item.required}
                                    onCheckedChange={(checked) => 
                                      updateItem(item.id, { required: checked as boolean })
                                    }
                                  />
                                  <Label htmlFor={`required-${item.id}`}>Required</Label>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItem(item.id, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItem(item.id, 'down')}
                                  disabled={index === sectionItems.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          onClick={() => addItem(section)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item to {section}
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
};