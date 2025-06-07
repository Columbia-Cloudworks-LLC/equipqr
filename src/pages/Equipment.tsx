
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package } from 'lucide-react';
import { Equipment } from '@/types';
import { EquipmentList } from '@/components/Equipment/EquipmentList';
import { Layout } from '@/components/Layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/equipment/equipmentListService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePersistedFilters } from '@/hooks/usePersistedFilters';
import { EquipmentImportButton } from '@/components/Equipment/Import';
import { ImportResult } from '@/services/equipment/equipmentImportService';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';

const EquipmentPage = () => {
  const { user, isLoading: authLoading, checkSession } = useAuth();
  const navigate = useNavigate();
  const { 
    selectedOrganization 
  } = useOrganization();
  const { invalidateEquipmentData } = useCacheInvalidation();
  
  // Use persisted filters (excluding organization since that's managed globally)
  const { 
    filters, 
    clearFilters 
  } = usePersistedFilters('equipment-page-filters');
  
  // Check authentication on component mount
  useEffect(() => {
    const validateAuth = async () => {
      const isAuthenticated = await checkSession();
      if (!isAuthenticated && !authLoading) {
        console.log('No authenticated user detected, redirecting to auth page');
        navigate('/auth');
      }
    };
    
    validateAuth();
  }, [authLoading, checkSession, navigate]);
  
  const { 
    data: equipment = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['equipment', selectedOrganization?.id],
    queryFn: async () => {
      return getEquipment(selectedOrganization?.id);
    },
    enabled: !!user && !!selectedOrganization,
  });

  // Handle auth state changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching equipment');
      refetch();
    } else if (!authLoading) {
      console.log('No user authenticated');
    }
  }, [user, authLoading, refetch]);

  // Handle error state
  useEffect(() => {
    if (error) {
      toast.error('Failed to load equipment data', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  }, [error]);

  // Handle import completion with enhanced cache invalidation
  const handleImportComplete = async (result: ImportResult) => {
    if (result.success && result.imported > 0) {
      console.log(`Import completed: ${result.imported} records imported`);
      
      // The import dialog already handles cache invalidation,
      // but we can also refetch the local data for immediate UI update
      try {
        await refetch();
        console.log('Equipment list refetched after import');
      } catch (error) {
        console.error('Error refetching equipment after import:', error);
      }
    }
  };

  // If still loading auth, show loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // If not authenticated, show login message
  if (!user) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You must be logged in to view equipment. Please <Link to="/auth" className="underline font-medium">sign in</Link> to continue.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Main content for authenticated users
  return (
    <Layout>
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
          <div className="flex gap-2 flex-wrap">
            {(filters.status !== 'all' || filters.team !== 'all' || filters.search) && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
            <EquipmentImportButton onImportComplete={handleImportComplete} />
            <Button asChild className="sm:self-end">
              <Link to="/equipment/new">
                <Package className="mr-2 h-4 w-4" />
                Add Equipment
              </Link>
            </Button>
          </div>
        </div>

        <EquipmentList 
          equipment={equipment} 
          isLoading={isLoading}
          persistedFilters={filters}
        />
      </div>
    </Layout>
  );
};

export default EquipmentPage;
