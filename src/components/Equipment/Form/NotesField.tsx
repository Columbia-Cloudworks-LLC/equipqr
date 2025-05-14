
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesFieldProps {
  notes: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function NotesField({ notes, onChange }: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        name="notes"
        value={notes}
        onChange={onChange}
        placeholder="Additional information about this equipment"
        rows={4}
      />
    </div>
  );
}
