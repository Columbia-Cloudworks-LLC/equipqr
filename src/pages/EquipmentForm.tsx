import { useLocation } from 'react-router-dom';
import { EquipmentForm as EquipmentFormComponent } from '@/components/Equipment/EquipmentForm';
import Layout from '@/components/Layout/Layout';
import { useAuthenticationCheck } from '@/hooks/useAuthenticationCheck';
import { useEquipmentFormData } from '@/hooks/useEquipmentFormData';
import { AuthCheckingState } from '@/components/Equipment/Form/AuthCheckingState';
import { AuthErrorState } from '@/components/Equipment/Form/AuthErrorState';
import { UnauthenticatedState } from '@/components/Equipment/Form/UnauthenticatedState';
import { SessionRestoredAlert } from '@/components/Equipment/Form/SessionRestoredAlert';

const EquipmentFormPage = () => {
  const location = useLocation();
  const { authStatus, authError, redirectToLogin } = useAuthenticationCheck();
  
  // Only proceed with data loading if authenticated
  const {
    equipment,
    equipmentError,
    isLoading,
    isEditMode,
    handleSave,
    handleRetry
  } = useEquipmentFormData(redirectToLogin);

  // Show loading while checking auth
  if (authStatus === 'loading') {
    return (
      <Layout>
        <AuthCheckingState />
      </Layout>
    );
  }
  
  // Show auth error
  if (authError) {
    return (
      <Layout>
        <AuthErrorState errorMessage={authError} />
      </Layout>
    );
  }
  
  // Show not authenticated message
  if (authStatus === 'unauthenticated') {
    return (
      <Layout>
        <UnauthenticatedState />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
        </h1>
        
        {/* Show info alert when redirected from auth */}
        {location.state?.fromAuth && <SessionRestoredAlert />}
        
        <EquipmentFormComponent 
          equipment={equipment} 
          onSave={handleSave}
          isLoading={isLoading}
          error={isEditMode ? equipmentError : undefined} 
          onRetry={handleRetry}
        />
      </div>
    </Layout>
  );
};

export default EquipmentFormPage;
