
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Edit2, Save } from 'lucide-react';
import { Organization, updateOrganization } from '@/services/organization';

interface OrganizationDetailsCardProps {
  organization: Organization;
  isOwner: boolean;
}

export function OrganizationDetailsCard({ organization, isOwner }: OrganizationDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm({
    defaultValues: {
      name: organization.name,
    },
  });

  const handleSave = async (formData: { name: string }) => {
    if (!organization) return;
    
    setIsSaving(true);
    const success = await updateOrganization(organization.id, {
      name: formData.name,
    });
    
    if (success) {
      setIsEditing(false);
    }
    
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </div>
        {isOwner && !isEditing && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="org-form"
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!isEditing || isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Organization ID</p>
                <p className="text-sm text-muted-foreground">{organization.id}</p>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              form.reset({
                name: organization.name,
              });
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            form="org-form"
            type="submit"
            disabled={isSaving}
          >
            {isSaving && (
              <Save className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
