
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/SettingsContext';

const NotificationSettings = () => {
  const { settings, updateSetting } = useSettings();

  const updateEmailNotification = (key: keyof typeof settings.emailNotifications, value: boolean) => {
    updateSetting('emailNotifications', {
      ...settings.emailNotifications,
      [key]: value,
    });
  };

  const updatePushNotification = (key: keyof typeof settings.pushNotifications, value: boolean) => {
    updateSetting('pushNotifications', {
      ...settings.pushNotifications,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications about your equipment and work orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Email Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-work-orders" className="text-sm">
                Work Order Updates
              </Label>
              <Switch
                id="email-work-orders"
                checked={settings.emailNotifications.workOrderUpdates}
                onCheckedChange={(checked) => updateEmailNotification('workOrderUpdates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-equipment" className="text-sm">
                Equipment Alerts
              </Label>
              <Switch
                id="email-equipment"
                checked={settings.emailNotifications.equipmentAlerts}
                onCheckedChange={(checked) => updateEmailNotification('equipmentAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-teams" className="text-sm">
                Team Assignments
              </Label>
              <Switch
                id="email-teams"
                checked={settings.emailNotifications.teamAssignments}
                onCheckedChange={(checked) => updateEmailNotification('teamAssignments', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-system" className="text-sm">
                System Updates
              </Label>
              <Switch
                id="email-system"
                checked={settings.emailNotifications.systemUpdates}
                onCheckedChange={(checked) => updateEmailNotification('systemUpdates', checked)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Push Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-work-orders" className="text-sm">
                Work Order Updates
              </Label>
              <Switch
                id="push-work-orders"
                checked={settings.pushNotifications.workOrderUpdates}
                onCheckedChange={(checked) => updatePushNotification('workOrderUpdates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-equipment" className="text-sm">
                Equipment Alerts
              </Label>
              <Switch
                id="push-equipment"
                checked={settings.pushNotifications.equipmentAlerts}
                onCheckedChange={(checked) => updatePushNotification('equipmentAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-teams" className="text-sm">
                Team Assignments
              </Label>
              <Switch
                id="push-teams"
                checked={settings.pushNotifications.teamAssignments}
                onCheckedChange={(checked) => updatePushNotification('teamAssignments', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
