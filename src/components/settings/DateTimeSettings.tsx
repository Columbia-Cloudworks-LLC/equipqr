
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';

const DateTimeSettings = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date & Time</CardTitle>
        <CardDescription>
          Configure how dates and times are displayed throughout the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(value: '12h' | '24h') => 
                updateSetting('timeFormat', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                <SelectItem value="24h">24-hour (14:30)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekStart">Week Starts On</Label>
            <Select
              value={settings.weekStartsOn}
              onValueChange={(value: 'sunday' | 'monday') => 
                updateSetting('weekStartsOn', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select week start" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateTimeSettings;
