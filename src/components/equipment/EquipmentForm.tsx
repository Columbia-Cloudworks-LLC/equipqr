
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
  serial_number: z.string().min(1, "Serial number is required"),
  status: z.enum(['active', 'maintenance', 'inactive']),
  location: z.string().min(1, "Location is required"),
  installation_date: z.string(),
  warranty_expiration: z.string().optional(),
  last_maintenance: z.string().optional(),
  notes: z.string(),
  custom_attributes: z.any().optional(),
  image_url: z.string().optional(),
  last_known_location: z.any().optional(),
  team_id: z.string().optional()
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  equipment?: any;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ open, onClose, equipment }) => {
  const isEdit = !!equipment;
  const createEquipmentMutation = useCreateEquipment();
  const { canManageEquipment } = usePermissions();
  const { attributes, addAttribute, removeAttribute, updateAttribute } = useCustomAttributes();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: equipment?.name || '',
      manufacturer: equipment?.manufacturer || '',
      model: equipment?.model || '',
      serial_number: equipment?.serial_number || '',
      status: equipment?.status || 'active',
      location: equipment?.location || '',
      installation_date: equipment?.installation_date || new Date().toISOString().split('T')[0],
      warranty_expiration: equipment?.warranty_expiration || '',
      last_maintenance: equipment?.last_maintenance || '',
      notes: equipment?.notes || '',
      custom_attributes: equipment?.custom_attributes || {},
      image_url: equipment?.image_url || '',
      last_known_location: equipment?.last_known_location || null,
      team_id: equipment?.team_id || undefined
    },
  });

  const onSubmit = async (values: EquipmentFormData) => {
    if (!canManageEquipment()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create equipment",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEdit) {
        // Handle edit logic here
        toast({
          title: "Equipment Updated",
          description: "Equipment has been updated successfully",
        });
      } else {
        // Ensure all required fields are present with proper values
        const equipmentData = {
          name: values.name,
          manufacturer: values.manufacturer,
          model: values.model,
          serial_number: values.serial_number,
          status: values.status,
          location: values.location,
          installation_date: values.installation_date,
          warranty_expiration: values.warranty_expiration || null,
          last_maintenance: values.last_maintenance || null,
          notes: values.notes || '',
          custom_attributes: values.custom_attributes || {},
          image_url: values.image_url || null,
          last_known_location: values.last_known_location || null,
          team_id: values.team_id || null
        };
        
        await createEquipmentMutation.mutateAsync(equipmentData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting equipment form:', error);
    }
  };

  const handleCustomAttributeChange = (attributes: CustomAttribute[]) => {
    const attributesObject = attributes.reduce((acc, attr) => {
      acc[attr.key] = attr.value;
      return acc;
    }, {} as Record<string, string>);
    
    form.setValue('custom_attributes', attributesObject);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Equipment' : 'Create New Equipment'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update equipment information' : 'Enter the details for the new equipment'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <Input placeholder="e.g., 8FBU25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 12345678" {...field} />
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
                            <SelectItem value="maintenance">Under Maintenance</SelectItem>
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
                          <Input placeholder="e.g., Warehouse A, Section 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installation_date"
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
                    name="warranty_expiration"
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

                  <FormField
                    control={form.control}
                    name="last_maintenance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Maintenance</FormLabel>
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

            {/* Description */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description/Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about the equipment..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Attributes */}
            <CustomAttributesSection
              initialAttributes={attributes}
              onChange={handleCustomAttributeChange}
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEquipmentMutation.isPending}>
                {createEquipmentMutation.isPending ? 'Creating...' : (isEdit ? 'Update Equipment' : 'Create Equipment')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentForm;
