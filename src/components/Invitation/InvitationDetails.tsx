
import React from 'react';

interface InvitationDetailsProps {
  invitationType: 'team' | 'organization';
  invitationDetails: any;
}

export function InvitationDetails({ invitationType, invitationDetails }: InvitationDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm">
        <div className="font-medium">Invited by:</div>
        <div>{invitationDetails.invited_by_email || 'A member'}</div>
      </div>
      <div className="text-sm">
        <div className="font-medium">Role:</div>
        <div className="capitalize">{invitationDetails.role}</div>
      </div>
      {invitationType === 'organization' && (
        <div className="text-sm">
          <div className="font-medium">Organization:</div>
          <div>{invitationDetails.organization?.name || invitationDetails.org_name || 'Unknown'}</div>
        </div>
      )}
      {invitationType === 'team' && (
        <div className="text-sm">
          <div className="font-medium">Team:</div>
          <div>{invitationDetails.team?.name || invitationDetails.team_name || 'Unknown'}</div>
        </div>
      )}
      {invitationType === 'team' && invitationDetails.org_name && (
        <div className="text-sm">
          <div className="font-medium">Organization:</div>
          <div>{invitationDetails.org_name}</div>
        </div>
      )}
    </div>
  );
}
