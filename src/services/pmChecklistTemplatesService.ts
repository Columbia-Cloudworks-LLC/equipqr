import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { PMChecklistItem } from './preventativeMaintenanceService';
import { nanoid } from 'nanoid';

// Temporary type until Supabase types are regenerated
export type PMTemplate = {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_protected: boolean;
  template_data: any; // Will be PMChecklistItem[] but stored as JSON
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export interface PMTemplateSummary {
  id: string;
  name: string;
  description?: string | null;
  is_protected: boolean;
  organization_id: string | null;
  sections: { name: string; count: number }[];
  itemCount: number;
}

export type TemplateItem = PMChecklistItem; // same shape as runtime, but condition always null in storage

// Helper function to generate sections summary from template data
export const generateSectionsSummary = (templateData: PMChecklistItem[]): { name: string; count: number }[] => {
  const sectionCounts = templateData.reduce((acc, item) => {
    acc[item.section] = (acc[item.section] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sectionCounts).map(([name, count]) => ({ name, count }));
};

// Helper function to convert template to summary
export const templateToSummary = (template: PMTemplate): PMTemplateSummary => {
  // Safely handle JSON type conversion with proper type checking
  let templateData: PMChecklistItem[] = [];
  if (Array.isArray(template.template_data)) {
    templateData = template.template_data as unknown as PMChecklistItem[];
  }
  
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    is_protected: template.is_protected,
    organization_id: template.organization_id,
    sections: generateSectionsSummary(templateData),
    itemCount: templateData.length
  };
};

export const pmChecklistTemplatesService = {
  // List all templates accessible to an organization (global + org-specific)
  async listTemplates(orgId: string): Promise<PMTemplate[]> {
    const { data, error } = await supabase
      .from('pm_checklist_templates')
      .select('*')
      .or(`organization_id.is.null,organization_id.eq.${orgId}`)
      .order('organization_id', { nullsFirst: true })
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get a specific template by ID
  async getTemplate(id: string): Promise<PMTemplate | null> {
    const { data, error } = await supabase
      .from('pm_checklist_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  },

  // Create a new template
  async createTemplate(templateData: {
    organizationId: string;
    name: string;
    description?: string;
    template_data: PMChecklistItem[];
    created_by: string;
  }): Promise<PMTemplate> {
    // Sanitize template data - ensure condition is null and notes are empty
    const sanitizedData = templateData.template_data.map(item => ({
      ...item,
      id: nanoid(), // Generate fresh IDs
      condition: null,
      notes: ''
    }));

    const { data, error } = await supabase
      .from('pm_checklist_templates')
      .insert({
        organization_id: templateData.organizationId,
        name: templateData.name,
        description: templateData.description,
        template_data: sanitizedData,
        created_by: templateData.created_by,
        updated_by: templateData.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing template
  async updateTemplate(id: string, updates: {
    name?: string;
    description?: string;
    template_data?: PMChecklistItem[];
    updated_by: string;
  }): Promise<PMTemplate> {
    const updateData: any = {
      updated_by: updates.updated_by
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.template_data !== undefined) {
      // Sanitize template data
      updateData.template_data = updates.template_data.map(item => ({
        ...item,
        condition: null,
        notes: ''
      }));
    }

    const { data, error } = await supabase
      .from('pm_checklist_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a template (will fail for protected templates via RLS)
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('pm_checklist_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Clone a template to a different organization with new name
  async cloneTemplate(sourceId: string, targetOrgId: string, newName?: string): Promise<PMTemplate> {
    // First, get the source template
    const sourceTemplate = await this.getTemplate(sourceId);
    if (!sourceTemplate) {
      throw new Error('Source template not found');
    }

    // Clone and sanitize the template data with fresh IDs
    const templateData = Array.isArray(sourceTemplate.template_data) 
      ? sourceTemplate.template_data as PMChecklistItem[] 
      : [];
    
    const clonedData = templateData.map(item => ({
      ...item,
      id: nanoid(), // Generate fresh IDs to prevent conflicts
      condition: null,
      notes: ''
    }));

    const cloneName = newName || `${sourceTemplate.name} (Copy)`;

    const { data, error } = await supabase
      .from('pm_checklist_templates')
      .insert({
        organization_id: targetOrgId,
        name: cloneName,
        description: sourceTemplate.description ? `${sourceTemplate.description} (Cloned)` : 'Cloned template',
        template_data: clonedData,
        is_protected: false, // Cloned templates are never protected
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
        updated_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};