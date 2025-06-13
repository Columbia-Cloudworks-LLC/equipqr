
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserSettings } from '@/types/settings';

interface UnitsSettingsProps {
  settings: UserSettings;
  onUpdate: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const UnitsSettings: React.FC<UnitsSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Unit System</CardTitle>
          <CardDescription>Choose between metric and imperial units</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.unitSystem}
            onValueChange={(value) => onUpdate('unitSystem', value as UserSettings['unitSystem'])}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="metric" id="metric" />
              <Label htmlFor="metric">Metric (km, kg, °C)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="imperial" id="imperial" />
              <Label htmlFor="imperial">Imperial (miles, lbs, °F)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Select your preferred currency</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.currency}
            onValueChange={(value) => onUpdate('currency', value as UserSettings['currency'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Number Format</CardTitle>
          <CardDescription>Choose how numbers are formatted</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.numberFormat}
            onValueChange={(value) => onUpdate('numberFormat', value as UserSettings['numberFormat'])}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="US" id="us-numbers" />
              <Label htmlFor="us-numbers">US (1,234.56)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="EU" id="eu-numbers" />
              <Label htmlFor="eu-numbers">European (1.234,56)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitsSettings;
