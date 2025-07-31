
import React from 'react';
import { useParams } from 'react-router-dom';
import { QRRedirectHandler } from '@/components/qr/QRRedirectHandler';

const QRRedirect = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();

  return <QRRedirectHandler equipmentId={equipmentId} />;
};

export default QRRedirect;
