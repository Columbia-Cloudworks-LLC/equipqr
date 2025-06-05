
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Settings, X } from 'lucide-react';
import { 
  shouldShowPrivacyBanner, 
  markPrivacyBannerSeen, 
  savePrivacyPreferences,
  getUserPrivacyPreferences,
  type PrivacyPreferences 
} from '@/services/privacy/privacyConfigService';
import { useAuth } from '@/contexts/AuthContext';

export function PrivacyBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    allow_analytics: false,
    allow_location_tracking: false,
    allow_detailed_device_info: false,
    data_retention_days: 30
  });
  const { user } = useAuth();

  useEffect(() => {
    const checkBanner = async () => {
      if (shouldShowPrivacyBanner()) {
        setShowBanner(true);
        const userPrefs = await getUserPrivacyPreferences(user?.id);
        setPreferences(userPrefs);
      }
    };
    checkBanner();
  }, [user]);

  const handleAcceptAll = async () => {
    const newPrefs = {
      allow_analytics: true,
      allow_location_tracking: true,
      allow_detailed_device_info: true,
      data_retention_days: 365
    };
    await savePrivacyPreferences(newPrefs, user?.id);
    markPrivacyBannerSeen();
    setShowBanner(false);
  };

  const handleAcceptMinimal = async () => {
    const newPrefs = {
      allow_analytics: false,
      allow_location_tracking: false,
      allow_detailed_device_info: false,
      data_retention_days: 30
    };
    await savePrivacyPreferences(newPrefs, user?.id);
    markPrivacyBannerSeen();
    setShowBanner(false);
  };

  const handleCustomize = async () => {
    await savePrivacyPreferences(preferences, user?.id);
    markPrivacyBannerSeen();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    markPrivacyBannerSeen();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
      <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Your Privacy Matters
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Privacy First
                </Badge>
              </div>
              
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                We respect your privacy. When you scan QR codes, we can collect anonymized data for 
                equipment tracking and analytics. You control what data we collect.
              </p>

              {showDetails && (
                <div className="space-y-3 mb-4 p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={preferences.allow_analytics}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          allow_analytics: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Allow analytics (scan patterns, usage statistics)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={preferences.allow_location_tracking}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          allow_location_tracking: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Allow location tracking (reduced precision)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={preferences.allow_detailed_device_info}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          allow_detailed_device_info: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Allow detailed device information</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleAcceptAll} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Accept All
                </Button>
                
                <Button 
                  onClick={handleAcceptMinimal} 
                  variant="outline" 
                  size="sm"
                  className="border-blue-300"
                >
                  Essential Only
                </Button>
                
                <Button 
                  onClick={() => setShowDetails(!showDetails)} 
                  variant="ghost" 
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {showDetails ? 'Hide' : 'Customize'}
                </Button>
                
                {showDetails && (
                  <Button 
                    onClick={handleCustomize} 
                    variant="outline" 
                    size="sm"
                    className="border-blue-300"
                  >
                    Save Preferences
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
