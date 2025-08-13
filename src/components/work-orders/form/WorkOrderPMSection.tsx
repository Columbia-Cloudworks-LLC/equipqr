import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, Info, CheckCircle2 } from "lucide-react";
import { WorkOrderFormData } from '@/hooks/useWorkOrderForm';
import { usePMTemplates } from '@/hooks/usePMTemplates';
import { generateSectionsSummary } from '@/services/pmChecklistTemplatesService';

interface WorkOrderPMSectionProps {
  values: WorkOrderFormData & { pmTemplateId?: string };
  setValue: (field: keyof (WorkOrderFormData & { pmTemplateId?: string }), value: any) => void;
}

export const WorkOrderPMSection: React.FC<WorkOrderPMSectionProps> = ({
  values,
  setValue
}) => {
  const { data: templates = [], isLoading } = usePMTemplates();
  
  // Find the selected template or default to global forklift template
  const selectedTemplate = templates.find(t => t.id === values.pmTemplateId) || 
                          templates.find(t => t.name === 'Forklift PM (Default)') || 
                          templates[0];

  const handleTemplateChange = (templateId: string) => {
    setValue('pmTemplateId', templateId);
  };

  return (
    <>
      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
        <Checkbox
          id="hasPM"
          checked={values.hasPM}
          onCheckedChange={(checked) => setValue('hasPM', checked as boolean)}
        />
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <Label htmlFor="hasPM" className="text-sm font-medium cursor-pointer">
            Include Preventative Maintenance
          </Label>
        </div>
      </div>

      {values.hasPM && (
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This work order will include a preventative maintenance checklist that must be completed before the work order can be marked as finished.
            </AlertDescription>
          </Alert>

          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="pmTemplate">Checklist Template</Label>
            <Select
              value={values.pmTemplateId || selectedTemplate?.id || ''}
              onValueChange={handleTemplateChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a checklist template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      {template.organization_id === null && (
                        <span className="text-xs text-muted-foreground">(Global)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Template Preview */}
          {selectedTemplate && (
            <div className="bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">PM Checklist Preview</span>
                <span className="text-xs text-muted-foreground">({selectedTemplate.itemCount} items)</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {selectedTemplate.sections.map((section) => (
                  <div key={section.name}>• {section.name} ({section.count} items)</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};