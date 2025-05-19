
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    role: string;
    org_name?: string;
    is_external?: boolean;
  };
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link to={`/teams?selected=${team.id}`} className="block no-underline">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{team.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Building className="h-3.5 w-3.5 mr-1" />
                <span>{team.org_name || 'Unknown Organization'}</span>
                {team.is_external && (
                  <Badge variant="outline" className="ml-2 text-xs bg-slate-100">External</Badge>
                )}
              </div>
            </div>
            <Badge 
              variant={team.role === 'manager' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {team.role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
