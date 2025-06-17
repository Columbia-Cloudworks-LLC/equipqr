
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Users, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useDashboardStats, useEquipmentByOrganization, useAllWorkOrders } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';

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
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Equipment
            </CardTitle>
            <CardDescription>
              Latest equipment in your fleet
            </CardDescription>
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
                  <div key={item.id} className="flex items-center justify-between">
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
                  </div>
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
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Work Orders
            </CardTitle>
            <CardDescription>
              Latest work order activity
            </CardDescription>
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
                  <div key={order.id} className="flex items-center justify-between">
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
                  </div>
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
                <div key={order.id} className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
