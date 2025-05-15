
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Package } from 'lucide-react';
import { Equipment } from '@/types';
import { EquipmentList } from '@/components/Equipment/EquipmentList';
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { Layout } from '@/components/Layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/equipment/equipmentListService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EquipmentPage = () => {
  const [view, setView] = useState<string>('list');
  const { user, isLoading: authLoading, checkSession } = useAuth();
  const navigate = useNavigate();
  
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
    queryKey: ['equipment'],
    queryFn: getEquipment,
    enabled: !!user, // Only run the query if the user is authenticated
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

  // Log equipment data for debugging
  useEffect(() => {
    if (Array.isArray(equipment)) {
      console.log(`EquipmentPage received ${equipment.length} equipment records`);
    }
  }, [equipment]);

  // Handle error state
  useEffect(() => {
    if (error) {
      toast.error('Failed to load equipment data', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  }, [error]);

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
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
          <Button asChild>
            <Link to="/equipment/new">
              <Package className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="list" value={view} onValueChange={setView}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="list" className="mt-4">
            <EquipmentList equipment={equipment} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : equipment.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {equipment.map((item) => (
                  <EquipmentCard key={item.id} equipment={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No equipment found</p>
                <Button variant="link" asChild>
                  <Link to="/equipment/new">Add your first equipment</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EquipmentPage;
