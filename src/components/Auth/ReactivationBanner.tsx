
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function ReactivationBanner() {
  const { user } = useAuth();
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [reactivationDeadline, setReactivationDeadline] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkDeactivationStatus();
  }, [user]);

  const checkDeactivationStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_deactivated, reactivation_deadline')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setIsDeactivated(data.is_deactivated);
      setReactivationDeadline(data.reactivation_deadline);
    } catch (error) {
      console.error('Error checking deactivation status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('reactivate_user');

      if (error) throw error;

      if (data.success) {
        toast.success('Account reactivated successfully!');
        setIsDeactivated(false);
        setReactivationDeadline(null);
        // Refresh the page to update the UI
        window.location.reload();
      }
    } catch (error) {
      console.error('Error reactivating account:', error);
      toast.error(error.message || 'Failed to reactivate account');
    } finally {
      setIsReactivating(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Your reactivation period has expired';
    } else if (diffDays === 1) {
      return 'You have 1 day left to reactivate';
    } else {
      return `You have ${diffDays} days left to reactivate`;
    }
  };

  if (isLoading || !isDeactivated || !reactivationDeadline) {
    return null;
  }

  const deadline = new Date(reactivationDeadline);
  const isExpired = deadline < new Date();

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-medium text-orange-800">
            Your account is deactivated
          </p>
          <p className="text-sm text-orange-700">
            {isExpired 
              ? 'Your reactivation period has expired. Your account cannot be restored.'
              : formatDeadline(reactivationDeadline)
            }
          </p>
        </div>
        {!isExpired && (
          <Button
            onClick={handleReactivate}
            disabled={isReactivating}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            {isReactivating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reactivating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reactivate Account
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
