
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEquipment } from '@/hooks/useSupabaseData';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/hooks/use-toast';
import CustomAttributesSection from './CustomAttributesSection';
import { useCustomAttributes, type CustomAttribute } from '@/hooks/useCustomAttributes';

const equipmentFormSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  status: z.enum(['active', 'maintenance', 'inactive']),
  location: z.string().min(1, "Location is required"),
  installationDate: z.string().optional(),
  warrantyExpiration: z.string().optional(),
  notes: z.string().optional(),
  customAttributes: z.array(z.object({
    id: z.string(),
    key: z.string(),
    value: z.string()
  })).optional()
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  equipment?: any;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ open, onClose, equipment }) => {
  const isEdit = !!equipment;
  const [customAttributesError, setCustomAttributesError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { validateAttributes } = useCustomAttributes();
  const createEquipmentMutation = useCreateEquipment();
  const { canCreateEquipment, canManageEquipment } = usePermissions();

  // Check permissions
  const canCreate = canCreateEquipment();
  const canEdit = equipment ? canManageEquipment(equipment.teamId) : false;
  
  if (!canCreate && !isEdit) {
    return null; // Don't render if user can't create
  }
  
  if (isEdit && !canEdit) {
    return null; // Don't render if user can't edit this equipment
  }

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: equipment?.name || '',
      manufacturer: equipment?.manufacturer || '',
      model: equipment?.model || '',
      serialNumber: equipment?.serialNumber || '',
      status: equipment?.status || 'active',
      location: equipment?.location || '',
      installationDate: equipment?.installationDate || '',
      warrantyExpiration: equipment?.warrantyExpiration || '',
      notes: equipment?.notes || '',
      customAttributes: equipment?.customAttributes || []
    }
  });

  const handleCustomAttributesChange = (attributes: CustomAttribute[]) => {
    form.setValue('customAttributes', attributes);
    setCustomAttributesError(false);
  };

  const onSubmit = async (data: EquipmentFormData) => {
    // Validate custom attributes separately
    const currentAttributes = form.getValues('customAttributes') || [];
    if (currentAttributes.length > 0) {
      const keys = currentAttributes.map(attr => attr.key.trim()).filter(Boolean);
      const uniqueKeys = new Set(keys);
      if (keys.length !== uniqueKeys.size || currentAttributes.some(attr => !attr.key.trim())) {
        setCustomAttributesError(true);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      if (isEdit) {
        // TODO: Implement update equipment mutation
        toast({
          title: 'Update Equipment',
          description: 'Equipment update functionality will be implemented soon.',
          variant: 'default',
        });
        onClose();
      } else {
        // Create new equipment
        const equipmentData = {
          ...data,
          installationDate: data.installationDate || new Date().toISOString().split('T')[0],
          lastMaintenance: new Date().toISOString().split('T')[0],
          // Convert custom attributes to the format expected by the database
          customAttributes: currentAttributes.length > 0 ? 
            Object.fromEntries(currentAttributes.map(attr => [attr.key, attr.value])) : 
            undefined
        };

        await createEquipmentMutation.mutateAsync(equipmentData);
        onClose();
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting equipment form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save equipment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setCustomAttributesError(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update equipment information' : 'Enter the details for the new equipment'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Forklift FL-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., FG25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TY2023FL001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Status and Location */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Status & Location
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Warehouse A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Installation Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyExpiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Expiration</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Custom Attributes */}
            <CustomAttributesSection
              initialAttributes={equipment?.customAttributes || []}
              onChange={handleCustomAttributesChange}
              hasError={customAttributesError}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about this equipment..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Equipment' : 'Add Equipment')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentForm;
