
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Settings, Palette } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';

const organizationFormSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name must be less than 100 characters'),
  logo: z.string().optional(),
  backgroundColor: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

interface OrganizationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: {
    id: string;
    name: string;
    plan: 'free' | 'premium';
    memberCount: number;
    maxMembers: number;
    features: string[];
    logo?: string;
    backgroundColor?: string;
  };
  currentUserRole: 'owner' | 'admin' | 'member';
}

export const OrganizationSettingsDialog: React.FC<OrganizationSettingsDialogProps> = ({
  open,
  onOpenChange,
  organization,
  currentUserRole
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { refreshSession } = useSession();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization.name,
      logo: organization.logo || '',
      backgroundColor: organization.backgroundColor || '',
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      toast.error('You do not have permission to update organization settings');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Update organization in database
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          logo: data.logo || null,
          background_color: data.backgroundColor || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);

      if (error) {
        throw error;
      }

      // Invalidate React Query cache
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      await queryClient.invalidateQueries({ queryKey: ['organization', organization.id] });
      
      // Refresh session context to update sidebar immediately
      await refreshSession();
      
      toast.success('Organization settings updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Settings
          </DialogTitle>
          <DialogDescription>
            Update your organization's name and branding
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Update your organization's name and branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={!canEdit || isUpdating}
                          placeholder="Enter organization name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={!canEdit || isUpdating}
                          placeholder="Enter logo URL"
                          type="url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Background Color
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            disabled={!canEdit || isUpdating}
                            placeholder="#ffffff"
                            type="text"
                          />
                          <input
                            type="color"
                            value={field.value || '#ffffff'}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={!canEdit || isUpdating}
                            className="w-12 h-10 rounded border border-input"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {canEdit && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                      <Save className="mr-2 h-4 w-4" />
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
