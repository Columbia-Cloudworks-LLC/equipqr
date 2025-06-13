
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';

const UnitsSettings = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Units & Measurements</CardTitle>
        <CardDescription>
          Configure your preferred units for temperature, distance, and other measurements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature Unit</Label>
            <Select
              value={settings.temperatureUnit}
              onValueChange={(value: 'celsius' | 'fahrenheit') => 
                updateSetting('temperatureUnit', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select temperature unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">Celsius (°C)</SelectItem>
                <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">Distance Unit</Label>
            <Select
              value={settings.distanceUnit}
              onValueChange={(value: 'metric' | 'imperial') => 
                updateSetting('distanceUnit', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select distance unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (km, m)</SelectItem>
                <SelectItem value="imperial">Imperial (mi, ft)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitsSettings;
