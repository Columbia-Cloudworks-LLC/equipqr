
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Play, Pause, XCircle, FileText, User } from 'lucide-react';
import { WorkOrder } from '@/services/supabaseDataService';

interface WorkOrderTimelineProps {
  workOrder: WorkOrder;
}

const WorkOrderTimeline: React.FC<WorkOrderTimelineProps> = ({ workOrder }) => {
  // Generate timeline events based on work order data
  const getTimelineEvents = () => {
    const events = [
      {
        id: 1,
        title: 'Work Order Created',
        description: `Work order was submitted${workOrder.assigneeName ? ` and assigned to ${workOrder.assigneeName}` : ''}`,
        timestamp: workOrder.created_date,
        type: 'created',
        icon: FileText,
        user: 'System'
      }
    ];

    // Add status-specific events
    if (workOrder.status === 'accepted' || workOrder.status === 'assigned' || 
        workOrder.status === 'in_progress' || workOrder.status === 'completed') {
      events.push({
        id: 2,
        title: 'Work Order Accepted',
        description: 'Work order was reviewed and accepted',
        timestamp: workOrder.created_date, // In real app, this would be a separate timestamp
        type: 'accepted',
        icon: CheckCircle,
        user: workOrder.assigneeName || 'Manager'
      });
    }

    if (workOrder.status === 'assigned' || workOrder.status === 'in_progress' || workOrder.status === 'completed') {
      events.push({
        id: 3,
        title: 'Work Assigned',
        description: `Assigned to ${workOrder.assigneeName}${workOrder.teamName ? ` (${workOrder.teamName})` : ''}`,
        timestamp: workOrder.created_date, // In real app, this would be a separate timestamp
        type: 'assigned',
        icon: User,
        user: 'Manager'
      });
    }

    if (workOrder.status === 'in_progress' || workOrder.status === 'completed') {
      events.push({
        id: 4,
        title: 'Work Started',
        description: 'Work has begun on this order',
        timestamp: workOrder.created_date, // In real app, this would be a separate timestamp
        type: 'in_progress',
        icon: Play,
        user: workOrder.assigneeName || 'Technician'
      });
    }

    if (workOrder.status === 'completed' && workOrder.completed_date) {
      events.push({
        id: 5,
        title: 'Work Completed',
        description: 'All work has been completed successfully',
        timestamp: workOrder.completed_date,
        type: 'completed',
        icon: CheckCircle,
        user: workOrder.assigneeName || 'Technician'
      });
    }

    if (workOrder.status === 'on_hold') {
      events.push({
        id: 6,
        title: 'Work On Hold',
        description: 'Work has been temporarily paused',
        timestamp: workOrder.created_date, // In real app, this would be a separate timestamp
        type: 'on_hold',
        icon: Pause,
        user: workOrder.assigneeName || 'Technician'
      });
    }

    if (workOrder.status === 'cancelled') {
      events.push({
        id: 7,
        title: 'Work Order Cancelled',
        description: 'Work order has been cancelled',
        timestamp: workOrder.created_date, // In real app, this would be a separate timestamp
        type: 'cancelled',
        icon: XCircle,
        user: 'Manager'
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assigned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const timelineEvents = getTimelineEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => {
            const Icon = event.icon;
            const isLast = index === timelineEvents.length - 1;
            
            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && <div className="w-px h-8 bg-border mt-2" />}
                </div>
                
                <div className="flex-1 space-y-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    <time className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground">by {event.user}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderTimeline;
