
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorStateProps {
  error: Error | unknown;
  onRetry: () => void;
  errorMessage?: string;
}

export function ErrorState({ error, onRetry, errorMessage }: ErrorStateProps) {
  // Process the error message
  const displayMessage = errorMessage || 
    (error instanceof Error ? error.message : 
    (typeof error === 'string' ? error : 'An unknown error occurred'));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Loading Equipment</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {displayMessage}
          </AlertDescription>
        </Alert>
        <Button onClick={onRetry}>Retry</Button>
      </CardContent>
    </Card>
  );
}
