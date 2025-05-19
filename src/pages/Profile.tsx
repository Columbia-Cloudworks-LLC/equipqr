import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id as any)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load your profile information');
          return;
        }
        
        if (data) {
          setUserProfile({
            id: data.id,
            display_name: data.display_name || '',
            job_title: data.job_title || '',
            timezone: data.timezone || 'UTC',
            datetime_format_preference: data.datetime_format_preference || 'MM/DD/YYYY h:mm A',
            phone_number: data.phone_number || '',
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
  }, [user, supabase]);

  const handleUpdateProfile = async (values: any) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
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
        .update(updates as any)
        .eq('id', user.id as any);

      if (error) {
        throw error;
      }
      
      setUserProfile({
        ...userProfile as any,
        ...updates
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      [field]: field === 'datetime_format_preference' 
        ? value as DateTimeFormat 
        : value,
    });
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
          <form onSubmit={(e) => handleUpdateProfile(e.target)}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email address cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={userProfile.display_name || ""}
                    onChange={(e) =>
                      handleChange("display_name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={userProfile.job_title || ""}
                    onChange={(e) => handleChange("job_title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={userProfile.phone_number || ""}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select
                    value={userProfile.timezone}
                    onValueChange={(value) => handleChange("timezone", value)}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="datetime_format">Date/Time Format</Label>
                  <Select
                    value={userProfile.datetime_format_preference}
                    onValueChange={(value) =>
                      handleChange("datetime_format_preference", value)
                    }
                  >
                    <SelectTrigger id="datetime_format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
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
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </Layout>
  );
}
