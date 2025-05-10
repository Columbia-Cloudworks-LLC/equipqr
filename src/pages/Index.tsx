
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, QrCode, Settings } from 'lucide-react';
import { DashboardStat, Equipment, TeamMember } from '@/types';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { MOCK_TEAM_MEMBERS } from '@/data/mockData';
import { Layout } from '@/components/Layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/equipmentService';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });

  useEffect(() => {
    // Still using mock data for team members for now
    setTeamMembers(MOCK_TEAM_MEMBERS);
  }, []);

  const stats: DashboardStat[] = [
    {
      label: 'Total Equipment',
      value: equipment.length,
      change: 12,
      icon: Package,
    },
    {
      label: 'In Use',
      value: equipment.filter(item => item.status === 'active').length,
      icon: Package,
    },
    {
      label: 'Maintenance',
      value: equipment.filter(item => item.status === 'maintenance').length,
      change: -5,
      icon: Settings,
    },
    {
      label: 'Team Members',
      value: teamMembers.length,
      change: 20,
      icon: Users,
    },
  ];

  // Get recently added equipment (last 4)
  const recentEquipment = [...equipment]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/equipment/new">
                <Package className="mr-2 h-4 w-4" />
                Add Equipment
              </Link>
            </Button>
          </div>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle>Recent Equipment</CardTitle>
                <CardDescription>
                  Recently added or updated equipment.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/equipment">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array(4).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-3/4" />
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          {Array(4).fill(0).map((_, j) => (
                            <div key={j}>
                              <Skeleton className="h-3 w-16 mb-1" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-between w-full">
                          {Array(3).fill(0).map((_, k) => (
                            <Skeleton key={k} className="h-8 w-16" />
                          ))}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : recentEquipment.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {recentEquipment.map((item) => (
                    <EquipmentCard key={item.id} equipment={item} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
                  <Package className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No equipment added yet</p>
                  <Button variant="link" asChild>
                    <Link to="/equipment/new">Add your first equipment</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/equipment">
                  <Package className="mr-2 h-4 w-4" />
                  Equipment Inventory
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/team">
                  <Users className="mr-2 h-4 w-4" />
                  Team Management
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/scanner">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
