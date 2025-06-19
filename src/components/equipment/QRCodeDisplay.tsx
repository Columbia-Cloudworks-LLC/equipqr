
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  equipmentId: string;
  open: boolean;
  onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ equipmentId, open, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Generate the QR code URL - this will direct to the equipment details page
  const qrValue = `${window.location.origin}/equipment/${equipmentId}`;

  useEffect(() => {
    if (open && canvasRef.current) {
      generateQRCode();
    }
  }, [open, equipmentId]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    try {
      // Generate QR code with high quality settings
      await QRCode.toCanvas(canvasRef.current, qrValue, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Also generate data URL for download
      const dataUrl = await QRCode.toDataURL(qrValue, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) {
      toast.error('QR code not ready for download');
      return;
    }

    const link = document.createElement('a');
    link.download = `equipment-${equipmentId}-qr.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded successfully');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Equipment QR Code',
          text: 'Scan this QR code to view equipment details',
          url: qrValue,
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('QR code URL copied to clipboard');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Equipment QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly access equipment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full"
                />
              )}
            </div>
          </div>

          {/* Equipment URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Equipment URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrValue}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownload} 
              className="flex-1"
              disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
