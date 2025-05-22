
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Layout } from "@/components/Layout/Layout";
import { DateTimeFormat } from "@/types/supabase-enums";
import { useForm, Controller } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UserProfile {
  id: string;
  display_name: string | null;
  job_title: string | null;
  timezone: string;
  datetime_format_preference: DateTimeFormat;
  phone_number: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Initialize React Hook Form
  const form = useForm({
    defaultValues: {
      display_name: "",
      job_title: "",
      timezone: "UTC",
      datetime_format_preference: "MM/DD/YYYY h:mm A" as DateTimeFormat,
      phone_number: "",
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching profile for user:", user.id);
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load your profile information');
          return;
        }
        
        if (data) {
          const profileData = {
            id: data.id,
            display_name: data.display_name || '',
            job_title: data.job_title || '',
            timezone: data.timezone || 'UTC',
            datetime_format_preference: data.datetime_format_preference || 'MM/DD/YYYY h:mm A',
            phone_number: data.phone_number || '',
          };
          
          setUserProfile(profileData);
          
          // Reset form with fetched values
          form.reset({
            display_name: profileData.display_name || '',
            job_title: profileData.job_title || '',
            timezone: profileData.timezone || 'UTC',
            datetime_format_preference: profileData.datetime_format_preference || 'MM/DD/YYYY h:mm A',
            phone_number: profileData.phone_number || '',
          });
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, form]);

  const handleUpdateProfile = async (values: any) => {
    if (!user) {
      toast.error("You need to be logged in to update your profile");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("Updating profile for user:", user.id);
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
        .eq('id', user.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }
      
      setUserProfile({
        ...userProfile as UserProfile,
        ...updates
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Loading Profile</h2>
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

        {userProfile && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={user?.email || ""}
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
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        )}
      </div>
    </Layout>
  );
}
