
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { DateTimeFormat } from "@/types/supabase-enums";
import { ProfileFormValues } from "@/types/profile";
import { ProfileCard } from "./ProfileCard";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfileFormProps {
  initialValues: ProfileFormValues;
  userId: string;
}

export function ProfileForm({ initialValues, userId }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    defaultValues: initialValues,
  });

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!userId) {
      toast.error("You need to be logged in to update your profile");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("Updating profile for user:", userId);
      console.log("With values:", values);
      
      const updates = {
        display_name: values.display_name,
        job_title: values.job_title,
        timezone: values.timezone,
        datetime_format_preference: values.datetime_format_preference,
        phone_number: values.phone_number,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
        <ProfileCard 
          title="Personal Information" 
          description="Update your personal details and preferences"
          footer={
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          }
        >
          <div className="space-y-2">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={initialValues.email || ""}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Your email address cannot be changed
              </p>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Zone</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      Eastern Time (ET)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (PT)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="datetime_format_preference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date/Time Format</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY h:mm A">
                      MM/DD/YYYY h:mm A (US)
                    </SelectItem>
                    <SelectItem value="DD/MM/YYYY h:mm A">
                      DD/MM/YYYY h:mm A (UK/EU)
                    </SelectItem>
                    <SelectItem value="YYYY-MM-DD HH:mm:ss">
                      YYYY-MM-DD HH:mm:ss (24h)
                    </SelectItem>
                    <SelectItem value="ISO">ISO 8601</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </ProfileCard>
      </form>
    </Form>
  );
}
