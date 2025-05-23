
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { InvitationContainer } from './components/InvitationContainer';
import { InvitationType } from '@/types/invitations';

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const invitationType = typeParam === 'organization' ? 'organization' : 'team';
  
  if (!token) {
    return (
      <div className="container mx-auto my-8 px-4">
        <h1 className="text-red-500 font-bold text-xl">Invalid invitation link</h1>
        <p className="text-gray-700">No invitation token was provided in the URL.</p>
      </div>
    );
  }
  
  return (
    <InvitationContainer 
      token={token}
      initialInvitationType={invitationType as InvitationType}
    />
  );
};

export default InvitationPage;
