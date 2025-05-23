
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseInvitationAcceptanceProps {
  onAccept: (token: string, type?: string) => Promise<any>;
  token: string;
  invitationType: 'team' | 'organization';
}

export function useInvitationAcceptance({ onAccept, token, invitationType }: UseInvitationAcceptanceProps) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  
  const handleAccept = async () => {
    setProcessing(true);
    try {
      await onAccept(token, invitationType);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  return {
    processing,
    handleAccept,
    handleDecline
  };
}
