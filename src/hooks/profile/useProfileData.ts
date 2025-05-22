
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileFormValues } from "@/types/profile";
import { useAuth } from "@/contexts/AuthContext";
import { DateTimeFormat } from "@/types/supabase-enums";

export function useProfileData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(null);

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
          setProfileData({
            email: user.email,
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
  }, [user]);

  return {
    profileData,
    isLoading,
    userId: user?.id
  };
}
