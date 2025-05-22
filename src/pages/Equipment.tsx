
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useIsMobile } from '@/hooks/use-mobile';

// Local storage key for view preference
const VIEW_PREFERENCE_KEY = 'equipqr-view-preference';

const EquipmentPage = () => {
  const isMobile = useIsMobile();
  const [view, setView] = useState<string>(() => {
    // Get saved preference or default to grid on mobile, list on desktop
    const savedView = localStorage.getItem(VIEW_PREFERENCE_KEY);
    return savedView || (isMobile ? 'grid' : 'list');
  });

  const { user, isLoading: authLoading, checkSession } = useAuth();
  const navigate = useNavigate();
  const { organizations, selectedOrganization, selectOrganization } = useOrganization();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    selectedOrganization?.id
  );
  
  // Update selectedOrgId when selectedOrganization changes
  useEffect(() => {
    if (selectedOrganization?.id) {
      setSelectedOrgId(selectedOrganization.id);
    }
  }, [selectedOrganization]);

  // Save view preference when it changes
  useEffect(() => {
    localStorage.setItem(VIEW_PREFERENCE_KEY, view);
  }, [view]);

  // Handle organization change
  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    selectOrganization(orgId);
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
    queryKey: ['equipment', selectedOrgId],
    queryFn: async () => {
      return getEquipment(selectedOrgId);
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
          <Button asChild className="sm:self-end">
            <Link to="/equipment/new">
              <Package className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>

        <Tabs defaultValue={view} value={view} onValueChange={setView}>
          <div className="flex justify-between items-center">
            <TabsList className="hidden sm:flex">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>
            <div className="sm:hidden w-full">
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                <option value="list">List View</option>
                <option value="grid">Grid View</option>
              </select>
            </div>
          </div>
          
          <TabsContent value="list" className="mt-4">
            <EquipmentList 
              equipment={equipment} 
              isLoading={isLoading}
              organizations={organizations}
              selectedOrgId={selectedOrgId}
              onOrganizationChange={handleOrganizationChange}
              showOrgSelector={showOrgSelector}
              view="list"
            />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-4">
            <EquipmentList 
              equipment={equipment} 
              isLoading={isLoading}
              organizations={organizations}
              selectedOrgId={selectedOrgId}
              onOrganizationChange={handleOrganizationChange}
              showOrgSelector={showOrgSelector}
              view="grid"
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EquipmentPage;
