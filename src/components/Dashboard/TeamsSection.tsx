
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamCard } from './TeamCard';

interface TeamsSectionProps {
  teams: any[];
  isLoading: boolean;
  isError: boolean;
  onRefresh?: () => void;
}

export function TeamsSection({ teams, isLoading, isError, onRefresh }: TeamsSectionProps) {
  // Validate teams data
  const validTeams = Array.isArray(teams) 
    ? teams.filter(team => team && team.id && team.name)
    : [];
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle>My Teams</CardTitle>
          <CardDescription>
            Teams you belong to across organizations.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/teams">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="mb-3">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Could not load team data</p>
            <Button variant="link" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        ) : validTeams.length > 0 ? (
          <div className="space-y-3">
            {validTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">You are not a member of any teams yet</p>
            <Button variant="link" asChild>
              <Link to="/teams">Manage teams</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
