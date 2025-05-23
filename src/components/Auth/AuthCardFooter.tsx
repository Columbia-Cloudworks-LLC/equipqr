
import { CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export function AuthCardFooter() {
  return (
    <CardFooter className="flex flex-col items-center gap-2">
      <p className="text-xs text-center text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
    </CardFooter>
  );
}
