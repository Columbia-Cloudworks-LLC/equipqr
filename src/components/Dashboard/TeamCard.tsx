
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    role?: string;
    org_name?: string;
    org_id?: string;
    is_external?: boolean;
  };
}

export function TeamCard({ team }: TeamCardProps) {
  // Safety checks with defaults for missing properties
  const {
    id = '',
    name = 'Unnamed Team',
    role = 'viewer',
    org_name = 'Unknown Organization',
    is_external = false
  } = team || {};

  if (!id) {
    console.warn('Team card received invalid team data', team);
    return null;
  }

  return (
    <Link to={`/teams?selected=${id}`} className="block no-underline">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Building className="h-3.5 w-3.5 mr-1" />
                <span>{org_name}</span>
                {is_external && (
                  <Badge variant="outline" className="ml-2 text-xs bg-slate-100">External</Badge>
                )}
              </div>
            </div>
            <Badge 
              variant={role === 'manager' || role === 'owner' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
