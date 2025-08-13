import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Globe, ArrowRight, Plus } from 'lucide-react';
import { usePMTemplates } from '@/hooks/usePMTemplates';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { generateSectionsSummary } from '@/services/pmChecklistTemplatesService';

export const OrganizationChecklistsTab: React.FC = () => {
  const navigate = useNavigate();
  const { currentOrganization } = useSimpleOrganization();
  const { data: templates, isLoading } = usePMTemplates();
  const { hasRole } = usePermissions();

  const isAdmin = hasRole(['owner', 'admin']);

  // Separate templates into global and organization-specific
  const globalTemplates = templates?.filter(t => !t.organization_id) || [];
  const orgTemplates = templates?.filter(t => t.organization_id === currentOrganization?.id) || [];

  const handleViewAllTemplates = () => {
    navigate('/pm-templates');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">PM Checklist Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage preventative maintenance checklist templates for your organization
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button onClick={() => navigate('/pm-templates')} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          )}
          <Button onClick={handleViewAllTemplates}>
            View All Templates
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Global Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalTemplates.length}</div>
              <p className="text-xs text-muted-foreground">Available to all organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Organization Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgTemplates.length}</div>
              <p className="text-xs text-muted-foreground">Custom for your organization</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Total Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(templates?.length || 0)}</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Templates Preview */}
        {templates && templates.length > 0 ? (
          <div>
            <h4 className="font-medium mb-3">Recent Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.slice(0, 4).map((template) => {
                const isOrgTemplate = template.organization_id === currentOrganization?.id;
                
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm line-clamp-1">{template.name}</CardTitle>
                        <div className="flex gap-1 ml-2">
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
                      {template.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{template.sections.length} sections</span>
                        <span>{template.itemCount} items</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No Templates Yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create or access PM checklist templates to standardize maintenance procedures
              </p>
              {isAdmin && (
                <Button onClick={() => navigate('/pm-templates')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};