
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserSettings } from '@/types/settings';

interface NotificationSettingsProps {
  settings: UserSettings;
  onUpdate: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => onUpdate('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => onUpdate('pushNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specific Alerts</CardTitle>
          <CardDescription>Choose which types of alerts you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="work-order-alerts">Work Order Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about work order updates and assignments
              </p>
            </div>
            <Switch
              id="work-order-alerts"
              checked={settings.workOrderAlerts}
              onCheckedChange={(checked) => onUpdate('workOrderAlerts', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-reminders">Maintenance Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders for scheduled maintenance
              </p>
            </div>
            <Switch
              id="maintenance-reminders"
              checked={settings.maintenanceReminders}
              onCheckedChange={(checked) => onUpdate('maintenanceReminders', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="team-updates">Team Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about team changes and announcements
              </p>
            </div>
            <Switch
              id="team-updates"
              checked={settings.teamUpdates}
              onCheckedChange={(checked) => onUpdate('teamUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
