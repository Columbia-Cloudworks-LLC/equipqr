
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, Mail, Settings, Crown, Shield, User } from 'lucide-react';
import TeamForm from '@/components/teams/TeamForm';

const Teams = () => {
  const [showForm, setShowForm] = useState(false);

  // Mock teams data
  const teams = [
    {
      id: '1',
      name: 'Maintenance Team',
      description: 'Responsible for equipment maintenance and repairs',
      memberCount: 8,
      workOrderCount: 15,
      members: [
        { id: '1', name: 'John Smith', email: 'john@company.com', role: 'manager', avatar: null },
        { id: '2', name: 'Sarah Davis', email: 'sarah@company.com', role: 'technician', avatar: null },
        { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'technician', avatar: null },
        { id: '4', name: 'Lisa Wilson', email: 'lisa@company.com', role: 'requestor', avatar: null },
      ]
    },
    {
      id: '2',
      name: 'Operations Team',
      description: 'Fleet operations and logistics coordination',
      memberCount: 12,
      workOrderCount: 8,
      members: [
        { id: '5', name: 'Tom Brown', email: 'tom@company.com', role: 'manager', avatar: null },
        { id: '6', name: 'Emily Johnson', email: 'emily@company.com', role: 'technician', avatar: null },
        { id: '7', name: 'David Wilson', email: 'david@company.com', role: 'technician', avatar: null },
        { id: '8', name: 'Anna Lee', email: 'anna@company.com', role: 'viewer', avatar: null },
      ]
    },
    {
      id: '3',
      name: 'Safety Team',
      description: 'Safety inspections and compliance monitoring',
      memberCount: 5,
      workOrderCount: 0,
      members: [
        { id: '9', name: 'Robert Chen', email: 'robert@company.com', role: 'manager', avatar: null },
        { id: '10', name: 'Maria Garcia', email: 'maria@company.com', role: 'technician', avatar: null },
        { id: '11', name: 'James Taylor', email: 'james@company.com', role: 'requestor', avatar: null },
      ]
    }
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'technician':
        return <User className="h-4 w-4 text-green-600" />;
      case 'requestor':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'viewer':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'technician':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'requestor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage your organization teams and members</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    {team.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {team.description}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{team.memberCount} members</span>
                </div>
                <div className="text-muted-foreground">
                  {team.workOrderCount} active work orders
                </div>
              </div>

              {/* Team Members Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Team Members</h4>
                <div className="space-y-2">
                  {team.members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge className={getRoleColor(member.role)} variant="outline">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </div>
                      </Badge>
                    </div>
                  ))}
                  {team.memberCount > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{team.memberCount - 3} more members
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first team.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Form Modal */}
      <TeamForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
      />
    </div>
  );
};

export default Teams;
