
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Mail, Trash2, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface InvitationCardProps {
  invitation: {
    id: string;
    email: string;
    role: string;
    created_at: string;
    status?: string;
  };
  onResend: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  isViewOnly?: boolean;
}

export function InvitationCard({ 
  invitation, 
  onResend, 
  onCancel, 
  isViewOnly = false 
}: InvitationCardProps) {
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend(invitation.id);
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(invitation.id);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = () => {
    const variant = invitation.role === 'manager' ? 'default' : 'secondary';
    return <Badge variant={variant} className="capitalize">{invitation.role}</Badge>;
  };

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="space-y-3">
          {/* Header with email and actions */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-base truncate">{invitation.email}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Invited {formatDate(invitation.created_at)}</span>
              </div>
            </div>
            
            {!isViewOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border shadow-lg">
                  <DropdownMenuItem onClick={handleResend} disabled={isResending}>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Invite
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleCancel} 
                    disabled={isCancelling}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Invite
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Status and Role */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending
            </Badge>
            {getRoleBadge()}
          </div>

          {/* Action buttons for non-dropdown view (if needed) */}
          {!isViewOnly && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResend}
                disabled={isResending}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Resend
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
