
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Calendar, User, Wrench, Clock } from 'lucide-react';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';

const WorkOrders = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock work orders data
  const workOrders = [
    {
      id: '1',
      title: 'Forklift FL-001 Annual Maintenance',
      description: 'Scheduled annual maintenance including oil change, filter replacement, and safety inspection',
      equipment: 'Forklift FL-001',
      status: 'assigned',
      priority: 'medium',
      assignee: 'John Smith',
      reporter: 'Mike Johnson',
      createdDate: '2024-06-08',
      dueDate: '2024-06-15',
      estimatedHours: 4
    },
    {
      id: '2',
      title: 'Generator GN-045 Fuel System Check',
      description: 'Investigate fuel efficiency issues and potential leak in fuel system',
      equipment: 'Generator GN-045',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Sarah Davis',
      reporter: 'Tom Wilson',
      createdDate: '2024-06-07',
      dueDate: '2024-06-10',
      estimatedHours: 6
    },
    {
      id: '3',
      title: 'Excavator EX-102 Hydraulic Inspection',
      description: 'Routine hydraulic system inspection and fluid level check',
      equipment: 'Excavator EX-102',
      status: 'submitted',
      priority: 'low',
      assignee: null,
      reporter: 'Lisa Brown',
      createdDate: '2024-06-09',
      dueDate: '2024-06-20',
      estimatedHours: 2
    },
    {
      id: '4',
      title: 'Compressor CP-023 Belt Replacement',
      description: 'Replace worn drive belt and check tension settings',
      equipment: 'Compressor CP-023',
      status: 'completed',
      priority: 'medium',
      assignee: 'John Smith',
      reporter: 'Mike Johnson',
      createdDate: '2024-06-05',
      dueDate: '2024-06-08',
      estimatedHours: 2
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assigned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.assignee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.reporter.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage maintenance and repair work orders</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search work orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <div className="space-y-4">
        {filteredWorkOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{order.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{order.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(order.priority)}>
                    {order.priority}
                  </Badge>
                  <Badge className={getStatusColor(order.status)}>
                    {formatStatusText(order.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Equipment:</span>
                    <span className="text-muted-foreground">{order.equipment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Assignee:</span>
                    <span className="text-muted-foreground">{order.assignee || 'Unassigned'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span className="text-muted-foreground">{new Date(order.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Due:</span>
                    <span className="text-muted-foreground">{new Date(order.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Est. Hours:</span>
                    <span className="text-muted-foreground">{order.estimatedHours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Reporter:</span>
                    <span className="text-muted-foreground">{order.reporter}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {order.status === 'submitted' && (
                  <Button variant="outline" size="sm">
                    Accept
                  </Button>
                )}
                {order.status === 'assigned' && (
                  <Button variant="outline" size="sm">
                    Start Work
                  </Button>
                )}
                {order.status === 'in_progress' && (
                  <Button variant="outline" size="sm">
                    Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No work orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'No work orders match your current filters.' 
                : 'Get started by creating your first work order.'}
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Work Order Form Modal */}
      <WorkOrderForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
      />
    </div>
  );
};

export default WorkOrders;
