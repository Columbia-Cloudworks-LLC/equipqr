
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPM, defaultForkliftChecklist, PMChecklistItem } from '@/services/preventativeMaintenanceService';
import { toast } from 'sonner';

export const useInitializePMChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workOrderId,
      equipmentId,
      organizationId,
      templateId
    }: {
      workOrderId: string;
      equipmentId: string;
      organizationId: string;
      templateId?: string;
    }) => {
      console.log('🔧 Initializing PM checklist for work order:', workOrderId);
      
      let checklistData = defaultForkliftChecklist;
      let notes = 'PM checklist initialized with default forklift maintenance items.';
      
      // If templateId provided, try to fetch template data
      if (templateId) {
        try {
          const { pmChecklistTemplatesService } = await import('@/services/pmChecklistTemplatesService');
          const template = await pmChecklistTemplatesService.getTemplate(templateId);
          
          if (template && Array.isArray(template.template_data)) {
            // Safely convert JSON to PMChecklistItem[] and sanitize
            const templateItems = template.template_data as unknown as PMChecklistItem[];
            checklistData = templateItems.map(item => ({
              ...item,
              condition: null,
              notes: ''
            }));
            notes = `PM checklist initialized from template: ${template.name}`;
          }
        } catch (error) {
          console.warn('Failed to fetch PM template, using default:', error);
          // Fall back to default checklist
        }
      }
      
      const pmRecord = await createPM({
        workOrderId,
        equipmentId,
        organizationId,
        checklistData,
        notes,
        templateId
      });

      if (!pmRecord) {
        throw new Error('Failed to create PM record');
      }

      console.log('✅ PM checklist initialized successfully:', pmRecord.id);
      return pmRecord;
    },
    onSuccess: (pmRecord, variables) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['preventativeMaintenance', variables.workOrderId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['workOrder', variables.organizationId, variables.workOrderId] 
      });
      
      toast.success('PM checklist initialized successfully');
    },
    onError: (error) => {
      console.error('❌ Error initializing PM checklist:', error);
      toast.error('Failed to initialize PM checklist');
    }
  });
};
