
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Component to monitor logout status and provide user feedback
 */
export function LogoutMonitor() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    const emergency = searchParams.get('emergency');
    
    if (emergency === 'true') {
      toast.warning('Emergency logout completed', {
        description: 'Your session has been cleared due to an authentication issue'
      });
      
      // Clear the emergency parameter from URL
      searchParams.delete('emergency');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  return null; // This component only handles side effects
}
