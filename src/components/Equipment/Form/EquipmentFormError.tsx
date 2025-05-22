
import { ErrorState } from './ErrorState';

interface EquipmentFormErrorProps {
  error: Error | unknown;
  onRetry: () => void;
}

export function EquipmentFormError({ error, onRetry }: EquipmentFormErrorProps) {
  return <ErrorState error={error} onRetry={onRetry} />;
}
