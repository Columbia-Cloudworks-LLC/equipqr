
import React from 'react';
import { Button } from '@/components/ui/button';

interface MemberLimitWarningProps {
  onUpgrade: () => void;
}

const MemberLimitWarning: React.FC<MemberLimitWarningProps> = ({ onUpgrade }) => {
  return (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="text-sm text-yellow-800">
        You've reached the member limit for the free plan. 
        <Button variant="link" className="p-0 h-auto ml-1" onClick={onUpgrade}>
          Upgrade to Premium
        </Button> 
        to add more members.
      </div>
    </div>
  );
};

export default MemberLimitWarning;
