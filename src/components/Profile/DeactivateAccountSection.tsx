
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function DeactivateAccountSection() {
  const { user } = useAuth();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [reason, setReason] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const handleDeactivate = async () => {
    if (!user) return;

    setIsDeactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('deactivate_user', {
        body: { reason: reason.trim() || null }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          data.isOnlyManager 
            ? 'Account deactivated. Your organization has been deleted as you were the only manager.'
            : 'Account deactivated. You have 7 days to reactivate before permanent deletion.'
        );
        
        // Sign out the user
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error(error.message || 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
      setShowDialog(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Deactivate Account</CardTitle>
        <CardDescription>
          Permanently deactivate your account. This action cannot be undone after 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Deactivating your account will:
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Immediately log you out of all devices</li>
              <li>Make your account inaccessible</li>
              <li>If you're the only manager, delete your organization and all its data</li>
              <li>Give you 7 days to reactivate before permanent deletion</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="deactivation-reason">Reason for deactivation (optional)</Label>
          <Textarea
            id="deactivation-reason"
            placeholder="Let us know why you're deactivating your account..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {reason.length}/500 characters
          </p>
        </div>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              Deactivate Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate your account and may delete your organization's data
                if you are the only manager. You will have 7 days to reactivate before
                the deletion becomes permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  'Deactivate Account'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
