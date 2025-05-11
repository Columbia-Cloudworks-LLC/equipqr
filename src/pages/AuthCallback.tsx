
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're coming from an invitation
    const invitationPath = sessionStorage.getItem('invitationPath');
    
    if (!isLoading) {
      if (user) {
        console.log("User authenticated:", user);
        toast.success('Logged in successfully');
        
        // If we have a stored invitation path, redirect to it
        if (invitationPath) {
          console.log("Redirecting to stored invitation path:", invitationPath);
          sessionStorage.removeItem('invitationPath'); // Clear the stored path
          
          // Small delay to ensure auth state is fully propagated
          setTimeout(() => {
            navigate(invitationPath);
          }, 500);
        } else {
          // Otherwise redirect to the dashboard
          navigate('/');
        }
      } else {
        console.log("Authentication failed");
        toast.error('Authentication failed');
        navigate('/auth');
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30">
      <Card className="w-[350px] shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary my-4" />
          <p className="text-center text-muted-foreground">
            {isLoading ? 'Logging you in...' : 'Redirecting...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
