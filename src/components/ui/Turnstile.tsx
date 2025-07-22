
import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

const TurnstileComponent: React.FC<TurnstileComponentProps> = ({
  onVerify,
  onError,
  onExpire,
  theme = 'auto'
}) => {
  return (
    <div className="flex justify-center my-4">
      <Turnstile
        siteKey="0x4AAAAAABl-Ka0TxW5_4bLG"
        onVerify={onVerify}
        onError={onError}
        onExpire={onExpire}
        theme={theme}
        size="normal"
      />
    </div>
  );
};

export default TurnstileComponent;
