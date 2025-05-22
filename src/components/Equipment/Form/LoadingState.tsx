
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoadingState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading Equipment Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">
            Fetching equipment details...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
