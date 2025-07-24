import React from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaComponentProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const HCaptchaComponent: React.FC<HCaptchaComponentProps> = ({
  onSuccess,
  onError,
  onExpire
}) => {
  return (
    <div className="flex justify-center my-4">
      <HCaptcha
        sitekey="0a70b436-810e-423e-8100-14e6829a319e"
        onVerify={onSuccess}
        onError={onError}
        onExpire={onExpire}
      />
    </div>
  );
};

export default HCaptchaComponent;