import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

const EquipmentPage = () => {
  const { user, isLoading: authLoading, checkSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization 
  } = useOrganization();
  
  // Use persisted filters
  const { 
    filters, 
    setFilterOrganization,
    clearFilters 
  } = usePersistedFilters('equipment-page-filters');
  
  // Initialize organization from URL parameter or filters
  useEffect(() => {
    const urlOrgId = searchParams.get('org');
    
    if (urlOrgId && organizations.length > 0) {
      // URL parameter takes precedence
      const org = organizations.find(o => o.id === urlOrgId);
      if (org && (!selectedOrganization || selectedOrganization.id !== urlOrgId)) {
        selectOrganization(urlOrgId);
        setFilterOrganization(urlOrgId);
      }
    } else if (filters.organization && organizations.length > 0 && !urlOrgId) {
      // Fall back to persisted filter if no URL parameter
      const org = organizations.find(o => o.id === filters.organization);
      if (org && (!selectedOrganization || selectedOrganization.id !== filters.organization)) {
        selectOrganization(filters.organization);
      }
    } else if (selectedOrganization && !filters.organization && !urlOrgId) {
      // Update filters with current selected organization if no URL or filter
      setFilterOrganization(selectedOrganization.id);
    }
  }, [searchParams, filters.organization, organizations, selectedOrganization, selectOrganization, setFilterOrganization]);

  // Handle organization change with full page reload
  const handleOrganizationChange = (orgId: string) => {
    if (orgId === selectedOrganization?.id) {
      return; // No change needed
    }
    
    // Create new URL with organization parameter
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    
    // Keep existing non-organization filters
    if (currentParams.get('status') && currentParams.get('status') !== 'all') {
      newParams.set('status', currentParams.get('status')!);
    }
    if (currentParams.get('team') && currentParams.get('team') !== 'all') {
      newParams.set('team', currentParams.get('team')!);
    }
    if (currentParams.get('search')) {
      newParams.set('search', currentParams.get('search')!);
    }
    
    // Set the new organization
    newParams.set('org', orgId);
    
    // Navigate with full page reload
    const newUrl = `/equipment?${newParams.toString()}`;
    window.location.href = newUrl;
  };
  
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
    enabled: !!user,
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

  // Determine if we should show the organization selector
  const showOrgSelector = organizations.length > 1;

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
          <div className="flex gap-2">
            {(filters.status !== 'all' || filters.team !== 'all' || filters.search) && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
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
          organizations={organizations}
          selectedOrgId={selectedOrganization?.id}
          onOrganizationChange={handleOrganizationChange}
          showOrgSelector={showOrgSelector}
          persistedFilters={filters}
        />
      </div>
    </Layout>
  );
};

export default EquipmentPage;
