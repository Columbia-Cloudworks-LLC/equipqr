
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserSettings } from '@/hooks/useUserSettings';
import { toast } from '@/hooks/use-toast';
import PersonalizationSettings from '@/components/settings/PersonalizationSettings';
import DateTimeSettings from '@/components/settings/DateTimeSettings';
import UnitsSettings from '@/components/settings/UnitsSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { RefreshCw, Save } from 'lucide-react';

const Settings = () => {
  const { settings, updateSetting, resetSettings, isLoading } = useUserSettings();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings reset",
      description: "All settings have been restored to their default values.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal preferences and account settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>
            Customize EquipQR to match your preferences. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personalization" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personalization">Personalization</TabsTrigger>
              <TabsTrigger value="datetime">Date & Time</TabsTrigger>
              <TabsTrigger value="units">Units & Numbers</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="personalization" className="mt-6">
              <PersonalizationSettings
                settings={settings}
                onUpdate={updateSetting}
              />
            </TabsContent>

            <TabsContent value="datetime" className="mt-6">
              <DateTimeSettings
                settings={settings}
                onUpdate={updateSetting}
              />
            </TabsContent>

            <TabsContent value="units" className="mt-6">
              <UnitsSettings
                settings={settings}
                onUpdate={updateSetting}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationSettings
                settings={settings}
                onUpdate={updateSetting}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
