
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';

interface FormFooterProps {
  isLoading: boolean;
  isEditing: boolean;
}

export function FormFooter({ isLoading, isEditing }: FormFooterProps) {
  return (
    <CardFooter className="flex justify-between">
      <Button 
        type="button" 
        variant="ghost" 
        onClick={() => window.history.back()}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : isEditing ? 'Update Equipment' : 'Add Equipment'}
      </Button>
    </CardFooter>
  );
}
