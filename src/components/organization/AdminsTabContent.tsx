
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { OrganizationAdmin } from '@/hooks/useOrganizationAdmins';
import { getRoleBadgeVariant } from '@/utils/badgeVariants';

interface AdminsTabContentProps {
  admins: OrganizationAdmin[];
  isLoading: boolean;
}

const AdminsTabContent: React.FC<AdminsTabContentProps> = ({ admins, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">Loading administrators...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (admins.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-8">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No administrators found</h3>
            <p className="text-muted-foreground">
              Invite members with admin privileges to help manage your organization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{admin.name}</h4>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
              </div>
              <Badge variant={getRoleBadgeVariant(admin.role)}>
                {admin.role === 'owner' ? 'Owner' : 'Admin'}
              </Badge>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Work Order Assignment:</strong> These administrators can receive work order assignments 
              for equipment that doesn't have an assigned team.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminsTabContent;
