
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { Equipment } from '@/types';
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentEquipmentSectionProps {
  recentEquipment: Equipment[];
  isLoading: boolean;
  isError: boolean;
}

export function RecentEquipmentSection({ recentEquipment, isLoading, isError }: RecentEquipmentSectionProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle>Recent Equipment</CardTitle>
          <CardDescription>
            Recently added or updated equipment.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/equipment">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    {Array(4).fill(0).map((_, j) => (
                      <div key={j}>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-between w-full">
                    {Array(3).fill(0).map((_, k) => (
                      <Skeleton key={k} className="h-8 w-16" />
                    ))}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
            <Package className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Could not load equipment data</p>
            <Button variant="link" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : recentEquipment.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recentEquipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
            <Package className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No equipment added yet</p>
            <Button variant="link" asChild>
              <Link to="/equipment/new">Add your first equipment</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
