import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Edit, Trash2, Lock, Globe, Building } from 'lucide-react';
import { usePMTemplates, useDeletePMTemplate, useClonePMTemplate } from '@/hooks/usePMTemplates';
import { ChecklistTemplateEditor } from './ChecklistTemplateEditor';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PMChecklistItem } from '@/services/preventativeMaintenanceService';

export const OrganizationChecklistsTab: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const { data: templates = [], isLoading } = usePMTemplates();
  const deleteTemplateMutation = useDeletePMTemplate();
  const cloneTemplateMutation = useClonePMTemplate();

  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string;
    name: string;
    description?: string | null;
    template_data: PMChecklistItem[];
  } | null>(null);
  const [cloningTemplateId, setCloningTemplateId] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');

  const globalTemplates = templates.filter(t => t.organization_id === null);
  const orgTemplates = templates.filter(t => t.organization_id !== null);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setEditorDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    // We need to fetch the full template data
    // For now, we'll create a basic structure
    setEditingTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      template_data: [] // This would be populated from the API
    });
    setEditorDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleClone = (templateId: string, templateName: string) => {
    setCloningTemplateId(templateId);
    setCloneName(`${templateName} (Copy)`);
    setCloneDialogOpen(true);
  };

  const handleCloneConfirm = async () => {
    if (!cloningTemplateId) return;

    try {
      await cloneTemplateMutation.mutateAsync({
        sourceId: cloningTemplateId,
        newName: cloneName
      });
      setCloneDialogOpen(false);
      setCloningTemplateId(null);
      setCloneName('');
    } catch (error) {
      console.error('Failed to clone template:', error);
    }
  };

  const renderTemplateCard = (template: any, isGlobal: boolean) => (
    <Card key={template.id} className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {template.name}
              {isGlobal && <Globe className="h-4 w-4 text-muted-foreground" />}
              {!isGlobal && <Building className="h-4 w-4 text-muted-foreground" />}
              {template.is_protected && <Lock className="h-4 w-4 text-amber-500" />}
            </CardTitle>
            <CardDescription className="mt-1">
              {template.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Badge variant={isGlobal ? "secondary" : "default"}>
              {isGlobal ? 'Global' : 'Organization'}
            </Badge>
            {template.is_protected && (
              <Badge variant="outline" className="text-amber-600">
                Protected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Section breakdown */}
          <div>
            <div className="text-sm font-medium mb-1">Sections ({template.sections.length})</div>
            <div className="flex flex-wrap gap-1">
              {template.sections.map((section: any) => (
                <Badge key={section.name} variant="outline" className="text-xs">
                  {section.name} ({section.count})
                </Badge>
              ))}
            </div>
          </div>

          {/* Total items */}
          <div className="text-sm text-muted-foreground">
            Total items: {template.itemCount}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleClone(template.id, template.name)}
              disabled={cloneTemplateMutation.isPending}
            >
              <Copy className="mr-1 h-3 w-3" />
              Clone
            </Button>

            {!isGlobal && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  disabled={template.is_protected}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>

                {!template.is_protected && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteTemplateMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{template.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(template.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Checklist Templates</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Checklist Templates</h2>
          <p className="text-sm text-muted-foreground">
            Manage reusable preventive maintenance checklists for your organization
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Global Templates */}
      {globalTemplates.length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Templates
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {globalTemplates.map(template => renderTemplateCard(template, true))}
          </div>
        </div>
      )}

      {/* Organization Templates */}
      <div>
        <h3 className="text-md font-medium mb-3 flex items-center gap-2">
          <Building className="h-4 w-4" />
          {currentOrganization?.name} Templates
        </h3>
        {orgTemplates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orgTemplates.map(template => renderTemplateCard(template, false))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <div className="text-muted-foreground">
              No organization templates yet. Create your first template or clone from global templates.
            </div>
          </Card>
        )}
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={editorDialogOpen} onOpenChange={setEditorDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'Modify the checklist template for your organization.' 
                : 'Create a new checklist template for your organization.'
              }
            </DialogDescription>
          </DialogHeader>
          <ChecklistTemplateEditor 
            template={editingTemplate}
            onSave={() => setEditorDialogOpen(false)}
            onCancel={() => setEditorDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>
              Create a copy of this template for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cloneName">Template Name</Label>
              <Input
                id="cloneName"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Enter name for cloned template"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCloneDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloneConfirm}
                disabled={!cloneName.trim() || cloneTemplateMutation.isPending}
              >
                Clone Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};