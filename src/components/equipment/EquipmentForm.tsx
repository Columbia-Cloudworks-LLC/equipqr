import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Team } from '@/types/team';
import { createEquipment, updateEquipment } from '@/services/EquipmentService';
import { Equipment, CreateEquipmentData, UpdateEquipmentData } from '@/types/equipment';
import { customerService } from '@/services/customerService';
import { useCustomersFeature } from '@/hooks/useCustomersFeature';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Equipment name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  image: z
    .any()
    .refine((files) => {
      if (files?.length === 0) {
        return true;
      }

      return files?.[0]?.size <= MAX_FILE_SIZE
    }, `Max image size is 5MB.`)
    .refine((files) => {
      if (files?.length === 0) {
        return true;
      }

      return ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type)
    }, "Only .jpg, .jpeg, .png and .webp formats are supported."),
  teamId: z.string().min(1, {
    message: "You need to select a team.",
  }),
  customerId: z.string().optional(),
});

interface EquipmentFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  equipment?: Equipment;
}

type EquipmentFormData = z.infer<typeof formSchema>

export function EquipmentForm({
  open,
  setOpen,
  equipment
}: EquipmentFormProps) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const { isEnabled: customersEnabled } = useCustomersFeature();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', currentOrganization?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teams?organizationId=${currentOrganization?.id}`);
      const data = await response.json();
      return data as Team[];
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrganization?.id],
    queryFn: () => customerService.getCustomers(currentOrganization!.id),
    enabled: !!currentOrganization?.id && customersEnabled,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: equipment?.name || "",
      description: equipment?.description || "",
      teamId: equipment?.assigned_team_id || equipment?.team_id || "",
      customerId: equipment?.customer_id || undefined,
    }
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: CreateEquipmentData) => {
      return await createEquipment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast.success('Equipment created successfully!');
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Something went wrong!');
      console.log(error);
    },
  })

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: UpdateEquipmentData) => {
      return await updateEquipment(equipment!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast.success('Equipment updated successfully!');
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Something went wrong!');
      console.log(error);
    },
  })

  const onSubmit = (data: EquipmentFormData) => {
    const equipmentData: CreateEquipmentData = {
      name: data.name,
      type: 'General',
      manufacturer: 'Default Manufacturer',
      model: 'Default Model',
      serial_number: 'DEFAULT-001',
      description: data.description,
      status: 'active',
      location: 'Default Location',
      installation_date: new Date().toISOString().split('T')[0],
      organizationId: currentOrganization?.id as string,
      team_id: data.teamId,
      image: data.image?.[0],
      custom_attributes: {},
      working_hours: 0,
      ...(customersEnabled && data.customerId && { customer_id: data.customerId }),
    };
    
    if (equipment) {
      updateEquipmentMutation.mutate(equipmentData);
    } else {
      createEquipmentMutation.mutate(equipmentData);
    }
  };

  React.useEffect(() => {
    if (equipment && open) {
      setValue("name", equipment.name);
      setValue("description", equipment.description || "");
      setValue("teamId", equipment.assigned_team_id || equipment.team_id || "");
      setValue("customerId", equipment.customer_id || '');
    }
  }, [equipment, open, setValue]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <h2>{equipment ? "Edit equipment" : "Create equipment"}</h2>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Equipment name</Label>
            <Input id="name" placeholder="Equipment name" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Equipment description</Label>
            <Textarea id="description" placeholder="Equipment description" {...register('description')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Equipment image</Label>
            <Input type="file" id="image"  {...register('image')} />
            {errors.image && (
              <p className="text-sm text-red-500">{String(errors.image.message)}</p>
            )}
          </div>
          
          {/* Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="teamId">Team</Label>
            <Select
              onValueChange={(value) => setValue('teamId', value)}
              defaultValue={equipment?.assigned_team_id || equipment?.team_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teamId && (
              <p className="text-sm text-red-500">{errors.teamId.message}</p>
            )}
          </div>

          {/* Customer Selection - NEW FIELD */}
          {customersEnabled && (
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer (Optional)</Label>
              <Select
                value={watch('customerId') || ''}
                onValueChange={(value) => setValue('customerId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}>
            {equipment ? "Update equipment" : "Create equipment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
