
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search equipment..."
        className="pl-8"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
