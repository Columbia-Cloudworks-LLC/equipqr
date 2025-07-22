
import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileComponentProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const TurnstileComponent: React.FC<TurnstileComponentProps> = ({
  onSuccess,
  onError,
  onExpire
}) => {
  return (
    <div className="flex justify-center my-4">
      <Turnstile
        siteKey="0x4AAAAAABl-Ka0TxW5_4bLG"
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
      />
    </div>
  );
};

export default TurnstileComponent;
