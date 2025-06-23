
import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const QRRedirect = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Store the intended destination in sessionStorage for post-login redirect
    if (equipmentId && !user && !isLoading) {
      sessionStorage.setItem('pendingRedirect', `/equipment/${equipmentId}?qr=true`);
    }
  }, [equipmentId, user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!equipmentId) {
    return <Navigate to="/scanner" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, redirect to equipment details with QR flag
  return <Navigate to={`/equipment/${equipmentId}?qr=true`} replace />;
};

export default QRRedirect;
