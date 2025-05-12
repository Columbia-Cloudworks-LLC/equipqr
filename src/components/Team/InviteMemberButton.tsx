
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InviteForm } from './InviteForm';
import { UserPlus } from "lucide-react";

interface InviteMemberButtonProps {
  onInvite: (email: string, role: string) => void;
  teams: any[];
}

export function InviteMemberButton({ onInvite, teams }: InviteMemberButtonProps) {
  const [open, setOpen] = useState(false);
  
  const handleInvite = (email: string, role: string) => {
    onInvite(email, role);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <InviteForm onInvite={handleInvite} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
