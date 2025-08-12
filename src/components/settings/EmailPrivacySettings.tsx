import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Shield, Mail, Users } from 'lucide-react';

interface EmailPrivacySettingsProps {
  currentEmailPrivate?: boolean;
  onUpdate?: (emailPrivate: boolean) => void;
}

export const EmailPrivacySettings: React.FC<EmailPrivacySettingsProps> = ({
  currentEmailPrivate = false,
  onUpdate
}) => {
  const { user } = useAuth();
  const [emailPrivate, setEmailPrivate] = useState(currentEmailPrivate);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePrivacy = async (newEmailPrivate: boolean) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_private: newEmailPrivate })
        .eq('id', user.id);

      if (error) throw error;

      setEmailPrivate(newEmailPrivate);
      onUpdate?.(newEmailPrivate);
      
      toast.success(
        newEmailPrivate 
          ? 'Email address is now private from organization members'
          : 'Email address is now visible to organization members'
      );
    } catch (error) {
      console.error('Failed to update email privacy:', error);
      toast.error('Failed to update email privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Email Privacy</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription>
          Control who can see your email address within your organizations.
        </CardDescription>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="email-private" className="text-sm font-medium">
                Hide email from organization members
              </Label>
              <p className="text-xs text-muted-foreground">
                Organization owners and admins can still see your email
              </p>
            </div>
          </div>
          <Switch
            id="email-private"
            checked={emailPrivate}
            onCheckedChange={handleUpdatePrivacy}
            disabled={isLoading}
          />
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Visibility Settings</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• You can always see your own email</div>
            <div>• Organization owners/admins can always see your email</div>
            <div>
              • {emailPrivate ? 'Regular organization members cannot see your email' : 'Organization members can see your email'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};