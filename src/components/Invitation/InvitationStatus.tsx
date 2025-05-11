
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ErrorMessageProps {
  error: string;
}

export function InvitationError({ error }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

export function InvalidInvitationCard({ error }: { error?: string }) {
  return (
    <Card className="w-full border-destructive">
      <CardHeader className="text-center">
        <CardTitle className="flex justify-center gap-2">
          <XCircle className="h-6 w-6 text-destructive" />
          <span>Invalid Invitation</span>
        </CardTitle>
        <CardDescription>
          This invitation link is not valid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'This invitation link is invalid or has expired.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function InvitationValidating() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Checking Invitation</CardTitle>
        <CardDescription>Validating your invitation...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center p-6">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}
