import React, { useState } from 'react';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { usePMTemplates } from '@/hooks/usePMTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Edit, Trash2, Wrench, Users } from 'lucide-react';
import { ChecklistTemplateEditor } from '@/components/organization/ChecklistTemplateEditor';
import { TemplateApplicationDialog } from '@/components/pm-templates/TemplateApplicationDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const PMTemplates = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { hasRole } = usePermissions();
  const { data: templates, isLoading } = usePMTemplates();
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateToApply, setTemplateToApply] = useState<string | null>(null);

  // Only org admins can access this page
  const isAdmin = hasRole(['owner', 'admin']);

  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PM Templates</h1>
          <p className="text-muted-foreground">
            Please select an organization to manage PM templates.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PM Templates</h1>
          <p className="text-muted-foreground">
            You need administrator permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplate(templateId);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const handleApplyTemplate = (templateId: string) => {
    setTemplateToApply(templateId);
  };

  const handleCloseApplication = () => {
    setTemplateToApply(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PM Templates</h1>
          <p className="text-muted-foreground">
            Manage preventative maintenance checklist templates for your organization.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const orgTemplates = templates?.filter(t => t.organization_id === currentOrganization.id) || [];
  const globalTemplates = templates?.filter(t => !t.organization_id) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PM Templates</h1>
          <p className="text-muted-foreground">
            Manage preventative maintenance checklist templates for your organization.
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {orgTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Organization Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isOrgTemplate={true}
                onEdit={() => handleEditTemplate(template.id)}
                onApply={() => handleApplyTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {globalTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Global Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {globalTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isOrgTemplate={false}
                onApply={() => handleApplyTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {templates?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Copy className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No templates found</h3>
                <p className="text-muted-foreground">
                  Create your first PM checklist template to get started.
                </p>
              </div>
              <Button onClick={handleCreateTemplate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ChecklistTemplateEditor
        templateId={editingTemplate}
      />

      {templateToApply && (
        <TemplateApplicationDialog
          templateId={templateToApply}
          open={!!templateToApply}
          onClose={handleCloseApplication}
        />
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: any;
  isOrgTemplate: boolean;
  onEdit?: () => void;
  onApply: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  isOrgTemplate, 
  onEdit, 
  onApply 
}) => {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            {!isOrgTemplate && (
              <Badge variant="secondary" className="text-xs">
                Global
              </Badge>
            )}
            {template.is_protected && (
              <Badge variant="outline" className="text-xs">
                Protected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Copy className="h-4 w-4" />
            <span>{template.sections_count} sections</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{template.total_items} items</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onApply}
            className="flex-1 gap-2"
            variant="default"
          >
            <Wrench className="h-4 w-4" />
            Apply to Equipment
          </Button>
          
          {isOrgTemplate && onEdit && !template.is_protected && (
            <Button
              onClick={onEdit}
              variant="outline"
              size="icon"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PMTemplates;