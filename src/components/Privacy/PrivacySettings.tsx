
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, Info, Save, RotateCcw } from 'lucide-react';
import { 
  getUserPrivacyPreferences, 
  savePrivacyPreferences,
  type PrivacyPreferences 
} from '@/services/privacy/privacyConfigService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function PrivacySettings() {
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    allow_analytics: false,
    allow_location_tracking: false,
    allow_detailed_device_info: false,
    data_retention_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPrefs = await getUserPrivacyPreferences(user?.id);
      setPreferences(userPrefs);
    } catch (error) {
      console.error('Error loading privacy preferences:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await savePrivacyPreferences(preferences, user?.id);
      if (success) {
        toast.success('Privacy settings saved successfully');
      } else {
        toast.error('Failed to save privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const defaultPrefs: PrivacyPreferences = {
        allow_analytics: false,
        allow_location_tracking: false,
        allow_detailed_device_info: false,
        data_retention_days: 30
      };
      setPreferences(defaultPrefs);
      toast.success('Privacy settings reset to defaults');
    } catch (error) {
      console.error('Error resetting privacy preferences:', error);
      toast.error('Failed to reset privacy settings');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPrivacyLevel = () => {
    const enabledCount = [
      preferences.allow_analytics,
      preferences.allow_location_tracking,
      preferences.allow_detailed_device_info
    ].filter(Boolean).length;

    if (enabledCount === 0) return { level: 'High Privacy', color: 'bg-green-500' };
    if (enabledCount === 1) return { level: 'Moderate Privacy', color: 'bg-yellow-500' };
    if (enabledCount === 2) return { level: 'Basic Privacy', color: 'bg-orange-500' };
    return { level: 'Full Analytics', color: 'bg-red-500' };
  };

  const privacyLevel = getPrivacyLevel();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Privacy & Data Collection</CardTitle>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${privacyLevel.color}`}></div>
            {privacyLevel.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="analytics" className="text-base font-medium">
                Analytics & Usage Data
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow collection of anonymized scan patterns and usage statistics
              </p>
            </div>
            <Switch
              id="analytics"
              checked={preferences.allow_analytics}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, allow_analytics: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="location" className="text-base font-medium">
                Location Tracking
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow collection of reduced-precision location data (±1km accuracy)
              </p>
            </div>
            <Switch
              id="location"
              checked={preferences.allow_location_tracking}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, allow_location_tracking: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="device-info" className="text-base font-medium">
                Detailed Device Information
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow collection of detailed browser and device characteristics
              </p>
            </div>
            <Switch
              id="device-info"
              checked={preferences.allow_detailed_device_info}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, allow_detailed_device_info: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-base font-medium">Data Retention</Label>
            <p className="text-sm text-muted-foreground">
              How long to keep your scan history data
            </p>
            <select
              value={preferences.data_retention_days}
              onChange={(e) => 
                setPreferences(prev => ({ 
                  ...prev, 
                  data_retention_days: parseInt(e.target.value) 
                }))
              }
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Privacy Protection</p>
              <p>
                Even with analytics enabled, all data is anonymized. IP addresses are never stored, 
                user agents are sanitized, and location data is reduced to approximate areas only.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
