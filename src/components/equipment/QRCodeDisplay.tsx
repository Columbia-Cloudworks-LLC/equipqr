
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  open: boolean;
  onClose: () => void;
  equipmentId: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ open, onClose, equipmentId }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);

  // Generate QR code URL - using the new /qr/ route for seamless authentication
  const qrCodeUrl = `${window.location.origin}/qr/${equipmentId}`;

  React.useEffect(() => {
    if (open && equipmentId) {
      generateQRCode();
    }
  }, [open, equipmentId]);

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `equipment-${equipmentId}-qr.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded successfully');
  };

  const copyQRCodeUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      setCopied(true);
      toast.success('QR code URL copied to clipboard');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Equipment QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center">
            {qrCodeDataUrl ? (
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Equipment QR Code"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Generating QR code...</div>
              </div>
            )}
          </div>

          {/* QR Code URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              QR Code URL:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-gray-50 rounded border text-sm font-mono break-all">
                {qrCodeUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyQRCodeUrl}
                className="flex items-center gap-1"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">How to use:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Print this QR code and attach it to the equipment</li>
              <li>Users can scan it with any QR code scanner</li>
              <li>They'll be taken directly to this equipment's details</li>
              <li>Scans are automatically logged with location data</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={downloadQRCode}
              disabled={!qrCodeDataUrl}
              className="flex items-center gap-2 flex-1"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
