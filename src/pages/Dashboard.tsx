
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Users, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useDashboardStats, useEquipmentByOrganization, useAllWorkOrders } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { getCurrentOrganization, isLoading: sessionLoading } = useSession();
  const currentOrganization = getCurrentOrganization();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: equipment, isLoading: equipmentLoading } = useEquipmentByOrganization();
  const { data: workOrders, isLoading: workOrdersLoading } = useAllWorkOrders();

  const isLoading = sessionLoading || statsLoading;

  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Please select an organization to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {currentOrganization.name}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentEquipment = equipment?.slice(0, 5) || [];
  const recentWorkOrders = workOrders?.slice(0, 5) || [];
  const highPriorityWorkOrders = workOrders?.filter(wo => wo.priority === 'high' && wo.status !== 'completed') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to {currentOrganization.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/equipment">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEquipment || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeEquipment || 0} active
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/equipment?status=maintenance">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Required</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.maintenanceEquipment || 0}</div>
              <p className="text-xs text-muted-foreground">
                Equipment needing attention
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/work-orders">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalWorkOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {workOrders?.filter(wo => wo.status !== 'completed').length || 0} active
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organization">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOrganization.memberCount}</div>
              <p className="text-xs text-muted-foreground">
                Active organization members
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Equipment */}
        <Card>
          <CardHeader>
            <Link to="/equipment" className="hover:opacity-80 transition-opacity">
              <CardTitle className="flex items-center gap-2 cursor-pointer">
                <Package className="h-5 w-5" />
                Recent Equipment
              </CardTitle>
              <CardDescription>
                Latest equipment in your fleet
              </CardDescription>
            </Link>
          </CardHeader>
          <CardContent>
            {equipmentLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentEquipment.length > 0 ? (
              <div className="space-y-4">
                {recentEquipment.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/equipment/${item.id}`}
                    className="flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.manufacturer} {item.model}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        item.status === 'active' ? 'default' : 
                        item.status === 'maintenance' ? 'destructive' : 'secondary'
                      }
                    >
                      {item.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No equipment found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Work Orders */}
        <Card>
          <CardHeader>
            <Link to="/work-orders" className="hover:opacity-80 transition-opacity">
              <CardTitle className="flex items-center gap-2 cursor-pointer">
                <ClipboardList className="h-5 w-5" />
                Recent Work Orders
              </CardTitle>
              <CardDescription>
                Latest work order activity
              </CardDescription>
            </Link>
          </CardHeader>
          <CardContent>
            {workOrdersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentWorkOrders.length > 0 ? (
              <div className="space-y-4">
                {recentWorkOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/work-orders/${order.id}`}
                    className="flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{order.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.priority} priority • {order.assigneeName || 'Unassigned'}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' : 
                        order.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No work orders found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High Priority Alerts */}
      {highPriorityWorkOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              High Priority Work Orders
            </CardTitle>
            <CardDescription>
              {highPriorityWorkOrders.length} work orders require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highPriorityWorkOrders.map((order) => (
                <Link 
                  key={order.id} 
                  to={`/work-orders/${order.id}`}
                  className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors"
                >
                  <div>
                    <p className="font-medium">{order.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(order.createdDate).toLocaleDateString()}
                      {order.dueDate && (
                        <> • Due: {new Date(order.dueDate).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <Badge variant="destructive">High Priority</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
