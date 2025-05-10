
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserRole } from '@/types/supabase-enums';

interface InviteFormProps {
  onInvite: (email: string, role: UserRole, teamId: string) => void;
  isLoading?: boolean;
  teams: { id: string; name: string }[];
}

export function InviteForm({ onInvite, isLoading = false, teams }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [teamId, setTeamId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate team selection
    if (!teamId) {
      toast.error('Please select a team');
      return;
    }
    
    onInvite(email, role, teamId);
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select value={teamId} onValueChange={setTeamId} required>
              <SelectTrigger id="team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={role} 
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager (Can manage team and equipment)</SelectItem>
                <SelectItem value="technician">Technician (Can update equipment and add notes)</SelectItem>
                <SelectItem value="viewer">Viewer (Read-only access)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isLoading || !teamId}>
            {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default InviteForm;
