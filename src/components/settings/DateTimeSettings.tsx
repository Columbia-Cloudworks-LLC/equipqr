
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserSettings } from '@/types/settings';

interface DateTimeSettingsProps {
  settings: UserSettings;
  onUpdate: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const DateTimeSettings: React.FC<DateTimeSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Date Format</CardTitle>
          <CardDescription>Choose how dates are displayed</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.dateFormat}
            onValueChange={(value) => onUpdate('dateFormat', value as UserSettings['dateFormat'])}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MM/DD/YYYY" id="us-date" />
              <Label htmlFor="us-date">MM/DD/YYYY (US format)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DD/MM/YYYY" id="eu-date" />
              <Label htmlFor="eu-date">DD/MM/YYYY (European format)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="YYYY-MM-DD" id="iso-date" />
              <Label htmlFor="iso-date">YYYY-MM-DD (ISO format)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Format</CardTitle>
          <CardDescription>Choose between 12-hour and 24-hour time format</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.timeFormat}
            onValueChange={(value) => onUpdate('timeFormat', value as UserSettings['timeFormat'])}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12h" id="12h" />
              <Label htmlFor="12h">12-hour (3:00 PM)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24h" id="24h" />
              <Label htmlFor="24h">24-hour (15:00)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimeSettings;
