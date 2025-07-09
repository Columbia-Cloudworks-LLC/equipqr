
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import PersonalizationSettings from '@/components/settings/PersonalizationSettings';
import { toast } from 'sonner';


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

      <PersonalizationSettings />

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
