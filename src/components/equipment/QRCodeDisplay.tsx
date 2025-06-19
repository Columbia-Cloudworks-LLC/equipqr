
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [error, setError] = useState<string>('');
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Generate the QR code URL with ?qr=true parameter to trigger scan detection
  const qrValue = `${window.location.origin}/equipment/${equipmentId}?qr=true`;

  // Canvas ref callback to ensure it's mounted
  const canvasRefCallback = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node) {
      console.log('Canvas element mounted');
      setCanvasReady(true);
    } else {
      setCanvasReady(false);
    }
  }, []);

  useEffect(() => {
    if (open && equipmentId && canvasReady) {
      console.log('Dialog opened, canvas ready, generating QR code');
      generateQRCode();
    }
  }, [open, equipmentId, canvasReady]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !equipmentId) {
      console.error('Canvas ref or equipment ID not available', {
        canvas: !!canvasRef.current,
        equipmentId: !!equipmentId
      });
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      console.log('Generating QR code for URL:', qrValue);
      console.log('Canvas dimensions:', {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        offsetWidth: canvasRef.current.offsetWidth,
        offsetHeight: canvasRef.current.offsetHeight
      });
      
      // Generate QR code on canvas with explicit sizing
      await QRCode.toCanvas(canvasRef.current, qrValue, {
        width: 200,
        height: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Generate data URL for download with higher resolution
      const dataUrl = await QRCode.toDataURL(qrValue, {
        width: 400,
        height: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrDataUrl(dataUrl);
      console.log('QR code generated successfully');
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
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

    try {
      const link = document.createElement('a');
      link.download = `equipment-${equipmentId}-qr.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Equipment QR Code',
          text: 'Scan this QR code to view equipment details',
          url: qrValue,
        });
        toast.success('Shared successfully');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Share failed, falling back to copy:', error);
          handleCopy();
        }
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

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQrDataUrl('');
      setError('');
      setIsGenerating(false);
      setCanvasReady(false);
    }
  }, [open]);

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
            <div className="w-52 h-52 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center p-4">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateQRCode}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <canvas
                  ref={canvasRefCallback}
                  width={200}
                  height={200}
                  style={{ 
                    display: 'block',
                    maxWidth: '200px',
                    maxHeight: '200px'
                  }}
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
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground"
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
              disabled={!qrDataUrl || isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare} 
              className="flex-1"
              disabled={isGenerating}
            >
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
