
import { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableRow, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Mail, 
  XCircle, 
  Calendar,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  token: string;
}

interface PendingInvitationsListProps {
  invitations: PendingInvitation[];
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvite: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function PendingInvitationsList({
  invitations,
  onResendInvite,
  onCancelInvite,
  isLoading
}: PendingInvitationsListProps) {
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);

  const handleResendInvite = async (id: string) => {
    try {
      setResendingInvite(id);
      await onResendInvite(id);
      toast.success('Invitation resent successfully');
    } catch (error: any) {
      toast.error(`Failed to resend invitation: ${error.message}`);
    } finally {
      setResendingInvite(null);
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      setCancellingInvite(id);
      await onCancelInvite(id);
      toast.success('Invitation cancelled successfully');
    } catch (error: any) {
      toast.error(`Failed to cancel invitation: ${error.message}`);
    } finally {
      setCancellingInvite(null);
    }
  };
  
  const copyInvitationLink = (token: string) => {
    const appUrl = window.location.origin;
    const invitationUrl = `${appUrl}/invitation/${token}`;
    
    navigator.clipboard.writeText(invitationUrl)
      .then(() => toast.success('Invitation link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy invitation link'));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-gray-500">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const createdDate = new Date(invitation.created_at);
            const expiresDate = new Date(invitation.expires_at);
            const isExpired = expiresDate < new Date();
            
            return (
              <TableRow key={invitation.id} className={isExpired ? 'bg-red-50' : ''}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>
                  <Badge variant={invitation.role === 'manager' ? 'default' : 'outline'}>
                    {invitation.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{format(createdDate, 'MMM d, yyyy')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{format(createdDate, 'PPpp')}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Calendar className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-gray-500'}`} />
                        <span className={isExpired ? 'text-red-500 font-medium' : ''}>
                          {format(expiresDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{format(expiresDate, 'PPpp')}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleResendInvite(invitation.id)}
                        disabled={resendingInvite === invitation.id}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {resendingInvite === invitation.id ? 'Sending...' : 'Resend invitation'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => copyInvitationLink(invitation.token)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy invitation link
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleCancelInvite(invitation.id)}
                        disabled={cancellingInvite === invitation.id}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <XCircle className="h-4 w-4" />
                        {cancellingInvite === invitation.id ? 'Cancelling...' : 'Cancel invitation'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
