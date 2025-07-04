
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import PersonalizationSettings from '@/components/settings/PersonalizationSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import UnitsSettings from '@/components/settings/UnitsSettings';
import DateTimeSettings from '@/components/settings/DateTimeSettings';
import { toast } from 'sonner';

const PrivacySettings = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy & Security</CardTitle>
        <CardDescription>
          Manage your privacy settings and data sharing preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="public"
                  name="profileVisibility"
                  value="public"
                  checked={settings.profileVisibility === 'public'}
                  onChange={() => updateSetting('profileVisibility', 'public')}
                />
                <Label htmlFor="public" className="text-sm">Public - Anyone can see your profile</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="team"
                  name="profileVisibility"
                  value="team"
                  checked={settings.profileVisibility === 'team'}
                  onChange={() => updateSetting('profileVisibility', 'team')}
                />
                <Label htmlFor="team" className="text-sm">Team - Only team members can see your profile</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="private"
                  name="profileVisibility"
                  value="private"
                  checked={settings.profileVisibility === 'private'}
                  onChange={() => updateSetting('profileVisibility', 'private')}
                />
                <Label htmlFor="private" className="text-sm">Private - Only you can see your profile</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="dataSharing">Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow anonymized usage data to help improve EquipQR
              </p>
            </div>
            <Switch
              id="dataSharing"
              checked={settings.dataSharing}
              onCheckedChange={(checked) => updateSetting('dataSharing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="analyticsOptOut">Analytics Opt-out</Label>
              <p className="text-sm text-muted-foreground">
                Opt out of analytics tracking
              </p>
            </div>
            <Switch
              id="analyticsOptOut"
              checked={settings.analyticsOptOut}
              onCheckedChange={(checked) => updateSetting('analyticsOptOut', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsContent = () => {
  const { resetSettings } = useSettings();

  const handleResetSettings = () => {
    resetSettings();
    toast.success('Settings have been reset to default values');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and application settings.
        </p>
      </div>

      <Tabs defaultValue="personalization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="units">Units & Time</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="personalization">
          <PersonalizationSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="units">
          <div className="space-y-6">
            <UnitsSettings />
            <DateTimeSettings />
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Reset Settings</CardTitle>
          <CardDescription>
            Reset all settings to their default values. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleResetSettings}>
            Reset All Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Settings = () => {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
};

export default Settings;
