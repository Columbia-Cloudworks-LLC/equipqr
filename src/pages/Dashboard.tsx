
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Users, AlertTriangle } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getDashboardStatsByOrganization } from '@/services/dataService';

const Dashboard = () => {
  const { currentOrganization, isLoading } = useOrganization();

  if (isLoading || !currentOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = getDashboardStatsByOrganization(currentOrganization.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to {currentOrganization.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {currentOrganization.plan === 'premium' ? '+12% from last month' : 'Track your fleet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Equipment</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEquipment > 0 ? Math.round((stats.activeEquipment / stats.totalEquipment) * 100) : 0}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {stats.maintenanceEquipment > 0 ? 'Needs attention' : 'All equipment operational'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkOrders}</div>
            <p className="text-xs text-muted-foreground">
              {currentOrganization.plan === 'premium' ? '5 due today' : 'Manage work orders'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Equipment Activity</CardTitle>
            <CardDescription>Latest equipment updates for {currentOrganization.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentOrganization.id === 'org-1' && (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Forklift FL-001 maintenance completed</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Generator GN-001 scheduled for maintenance</p>
                      <p className="text-xs text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>
                </>
              )}
              {currentOrganization.id === 'org-2' && (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Excavator EX-201 moved to Site Alpha</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bulldozer BD-401 hydraulic repair in progress</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crane CR-301 passed safety inspection</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </>
              )}
              {currentOrganization.id === 'org-3' && (
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Van VN-101 routine maintenance completed</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>Your teams and quick actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentOrganization.plan === 'premium' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Heavy Equipment Team</p>
                      <p className="text-xs text-muted-foreground">8 active members</p>
                    </div>
                    <div className="text-sm text-muted-foreground">12 work orders</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Safety & Inspection</p>
                      <p className="text-xs text-muted-foreground">4 active members</p>
                    </div>
                    <div className="text-sm text-muted-foreground">3 work orders</div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {currentOrganization.id === 'org-1' ? 'Maintenance Team' : 'Operations'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentOrganization.id === 'org-1' ? '3 active members' : '2 active members'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.totalWorkOrders} work orders
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
