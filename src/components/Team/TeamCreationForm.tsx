
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamCreationFormProps {
  onCreateTeam: (name: string) => void;
  isLoading?: boolean;
}

export function TeamCreationForm({ onCreateTeam, isLoading = false }: TeamCreationFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    onCreateTeam(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Creating...' : 'Create Team'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default TeamCreationForm;
